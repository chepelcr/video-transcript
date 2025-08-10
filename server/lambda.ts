// Lambda deployment entry point
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { lambdaHandler } from './src/utils/lambda-handler';

// Export the Lambda handler for AWS deployment
export const handler = lambdaHandler;

// Also export for serverless frameworks
export { lambdaHandler as awsLambdaHandler };