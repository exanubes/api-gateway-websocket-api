exports.handler = async (event) => {
    let response = '';
    if (event.body === 'Marko?') {
        response = 'Polo!';
    } else {
        response = 'Marko?';
    }

    return {
        statusCode: 200,
        body: response
    };
};