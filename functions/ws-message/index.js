const { DeleteItemCommand, DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} = require('@aws-sdk/client-apigatewaymanagementapi');

const dbClient = new DynamoDBClient();
const table = process.env.CONNECTIONS_TABLE;

exports.handler = async function handler(event) {
    const body = JSON.parse(event.body);
    // https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

    const connections = await getConnections(table);

    const apiGw = new ApiGatewayManagementApiClient({
        apiVersion: '2018-11-29',
        endpoint
    });

    await Promise.all(
        connections.map(async (connection) => {
            try {
                const input = {
                    ConnectionId: connection.connectionId.S,
                    Data: body.data
                };
                const command = new PostToConnectionCommand(input);
                return await apiGw.send(command);
            } catch (error) {
                if (error.$metadata.httpStatusCode === 410) {
                    await handleStaleConnection(table, connection.connectionId.S);
                }
            }
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'emit lambda function'
        })
    };
};

/**
 * @param {string} table
 * @param {string} connectionId
 * @returns {undefined}
 * */
function handleStaleConnection(table, connectionId) {
    /**
     * @type {import('@aws-sdk/client-dynamodb').DeleteItemCommandInput}
     * */
    const input = {
        TableName: table,
        Key: { connectionId: { S: connectionId } },
    };
    const command = new DeleteItemCommand(input);
    return void dbClient.send(command);
}

/**
 * @param {string} table
 * @returns {Promise<{connectionId: {S: string}}[]>}
 * */
async function getConnections(table) {
    /**
     * @type {import('@aws-sdk/client-dynamodb').ScanCommandInput}
     * */
    const input = {
        TableName: table,
        ProjectionExpression: "connectionId",
    };
    const command = new ScanCommand(input);

    const response = await dbClient.send(command);
    return response.Items ?? [];
}
