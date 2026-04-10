const authUser = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ","")
        if(!token){
            
        }

        if (!user) {
            return res.status(401).json({ message: "Invalid access token" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized request" });
    }
}

export default authUser;