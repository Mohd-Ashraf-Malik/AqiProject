import demoModel from "../models/demoModel.js";
// Route for myself
const demoControllerFunc = async (req, res) => {
  try {
    return res.status(200).json({
        success: true,
        message: "demoMessage"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "demo server error"
    });
  }
};

export { demoControllerFunc };