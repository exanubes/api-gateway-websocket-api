import * as aws from "@pulumi/aws";
import * as pulumi from '@pulumi/pulumi'
import {NodejsFunction} from "@exanubes/pulumi-nodejs-function";

const table = new aws.dynamodb.Table('connections', {
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

const connectLambda = new NodejsFunction('WebSocket_Connect', {
    code: new pulumi.asset.FileArchive('functions/ws-connect'),
    handler: 'index.handler',
    environment: {
        variables: {
            CONNECTIONS_TABLE: table.arn
        }
    },
    policy: {
        policy: table.arn.apply((tableArn) =>
            JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: ['dynamodb:PutItem'],
                        Effect: 'Allow',
                        Resource: tableArn
                    }
                ]
            })
        )
    }
});

const connectIntegration = new aws.apigatewayv2.Integration('connect-integration', {
    apiId: api.id,
    integrationType: 'AWS_PROXY',
    integrationUri: connectLambda.handler.invokeArn
});

connectLambda.grantInvoke(
    'apigw-connect-grant-invoke',
    'apigateway.amazonaws.com',
    pulumi.interpolate`${api.executionArn}/${stage.name}/$connect`
);
