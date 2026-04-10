import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import api from '../utils/api.js'

export const demoContext = createContext();

const demoContextProvider = (props) =>{
    const demo = "";
    const [search,setSearch] = useState('');
    const [showSearch,setShowSearch] = useState(false);
    const navigate = useNavigate();

    const demoFunc = async () =>{
        return "demo"
    }
    
    useEffect(()=>{
        demo();
    },[])
    
    const value = {
        demo,demoFunc,search,setSearch,showSearch,setShowSearch
    }

    return (
        <demoContext.Provider value={value}>
            {props.children}
        </demoContext.Provider>
    )
}

export default demoContextProvider;