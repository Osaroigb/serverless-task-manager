import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import { ServerlessTaskManagerStack } from '../lib/serverless-task-manager-stack';

describe('ServerlessTaskManagerStack', () => {
  let app: cdk.App;
  let stack: ServerlessTaskManagerStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServerlessTaskManagerStack(app, 'TestStack');
  });

  test('should create a DynamoDB table with correct properties', () => {
    expect(stack).toHaveResource('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'taskId',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'taskId',
          KeyType: 'HASH',
        },
      ],
    });
  });

  test('should create the create-task Lambda function with correct properties', () => {
    expect(stack).toHaveResource('AWS::Lambda::Function', {
      Handler: 'lambdas/create-task.handler',
      Runtime: 'nodejs14.x',
      MemorySize: 256,
    });
  });

  test('should create the get-task Lambda function with correct properties', () => {
    expect(stack).toHaveResource('AWS::Lambda::Function', {
      Handler: 'lambdas/get-task.handler',
      Runtime: 'nodejs14.x',
      MemorySize: 256,
    });
  });

  // Test Update Task Lambda function creation
  test('should create the update-task Lambda function with correct properties', () => {
    expect(stack).toHaveResource('AWS::Lambda::Function', {
      Handler: 'lambdas/update-task.handler',
      Runtime: 'nodejs14.x',
      MemorySize: 256,
    });
  });

  // Test Delete Task Lambda function creation
  test('should create the delete-task Lambda function with correct properties', () => {
    expect(stack).toHaveResource('AWS::Lambda::Function', {
      Handler: 'lambdas/delete-task.handler',
      Runtime: 'nodejs14.x',
      MemorySize: 256,
    });
  });

  // Test API Gateway creation with correct properties
  test('should create an API Gateway with correct properties', () => {
    expect(stack).toHaveResource('AWS::ApiGateway::RestApi', {
      Name: 'Tasks Service',
    });
  });

  // Test IAM Role creation for Lambda functions
  test('should create IAM roles with correct policies for Lambda functions', () => {
    expect(stack).toHaveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });

    expect(stack).toHaveResource('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: expect.arrayContaining([
          expect.objectContaining({
            Action: expect.arrayContaining([
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ]),
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  test('should export the DynamoDB table name', () => {
    expect(stack).toHaveOutput({
      outputName: 'TaskTableName',
      outputValue: {
        'Fn::GetAtt': ['TestStackDynamoDBTable', 'Arn'],
      },
    });
  });
});
