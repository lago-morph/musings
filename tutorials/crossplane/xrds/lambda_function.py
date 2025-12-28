def handler(event, context):
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': '{"message": "Hello from ApiEndpoint Lambda! This 404 proves end-to-end connectivity works. No routes configured yet - that\'s what ApiRoute will add later."}'
    }