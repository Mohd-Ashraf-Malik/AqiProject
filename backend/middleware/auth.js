const demoAuth = async (req, res, next) => {
    try {
        const demoToken = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ","")
        if(!demoToken){
            return res.status(401).json({ message: "Invalid access token" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized request" });
    }
}

export default demoAuth;