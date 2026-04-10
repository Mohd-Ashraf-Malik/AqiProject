import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from '../utils/api.js'

export const demoContext = createContext();

const demoContextProvider = (props) =>{
    const demo = "";

    const demoFunc = async () =>{
        return "demo"
    }
    
    useEffect(()=>{
        demo();
    },[])
    
    const value = {
        demo,demoFunc
    }

    return (
        <demoContext.Provider value={value}>
            {props.children}
        </demoContext.Provider>
    )
}

export default demoContextProvider;