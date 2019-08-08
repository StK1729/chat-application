const generateMessage = (username, text) => {
    return {
        username,
        text,
        timestamp: Date.now()
    }
}

const generateURL = (username, url) => {
    return {
        username,
        url,
        timestamp: Date.now()
    }
}

module.exports = {
    generateMessage,
    generateURL
}