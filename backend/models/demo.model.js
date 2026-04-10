import mongoose from "mongoose";

const demoSchema = new mongoose.Schema({
    demoName: {type: String,required:true},
},{timestamps,minimize:false})
demo.methods.functionName = function(){
    return "demo";
}

const demoModel = mongoose.model('demo',demoSchema)

export default demoModel;