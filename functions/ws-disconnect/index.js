const { DeleteItemCommand, DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient();
const table = process.env.CONNECTIONS_TABLE;

exports.handler = async function handler(event) {
    const input = {
        TableName: table,
        Key: {
            connectionId: { S: event.requestContext.connectionId }
        }
    };

    const command = new DeleteItemCommand(input);
    await client.send(command);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'disconnected.'
        })
    };
};