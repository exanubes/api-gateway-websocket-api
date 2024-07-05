import * as aws from "@pulumi/aws";

new aws.dynamodb.Table('connections', {
    name: 'WS_CONNECTIONS',
    attributes: [
        { name: 'connectionId', type: 'S' },
    ],
    billingMode: 'PAY_PER_REQUEST',
    hashKey: 'connectionId',
});

const api = new aws.apigatewayv2.Api('websocket-api', {
    name: 'exanubes-websocket-api',
    protocolType: 'WEBSOCKET',
    routeSelectionExpression: '$request.body.type'
});

const stage = new aws.apigatewayv2.Stage(`api-dev-stage`, {
    name: 'dev',
    apiId: api.id,
    autoDeploy: true
});