export const protect = async (req, res, next) => {
    try {
        // Check for development token first
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.includes('dev_token_123')) {
            // Development mode - mock the auth function
            req.auth = () => ({ userId: 'dev_user_123' })
            return next()
        }

        // Normal Clerk authentication
        const {userId} = await req.auth();
        if(!userId){
            return res.json({success: false, message: "not authenticated"  })
        }
        next()
    } catch (error) {
        // Check if this is a development token request
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.includes('dev_token_123')) {
            req.auth = () => ({ userId: 'dev_user_123' })
            return next()
        }

        res.json({success: false, message: error.message  })
    }
}
