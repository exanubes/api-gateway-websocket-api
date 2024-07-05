const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient();

const table = process.env.CONNECTIONS_TABLE;
exports.handler = async (event) => {
    const input = {
        TableName: table,
        Item: {
            connectionId: {
                S: event.requestContext.connectionId
            }
        }
    };

    const command = new PutItemCommand(input);
    const response = await client.send(command);

    return {
        statusCode: 201,
        body: JSON.stringify({
            message: 'Connected.'
        })
    };
};