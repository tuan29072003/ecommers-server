

const express=require("express")
const dotenv=require('dotenv');
const { default: mongoose } = require("mongoose");
const cors = require('cors');
const UserRouter = require('./routers/UserRouter')
const SupplierRouter = require('./routers/SupplierRouter')
const ProductRouter = require('./routers/ProductRouter')

dotenv.config();

const app=express();
const port=process.env.PORT||3001;

app.use(express.json())//chuyển dữ liệu sang kiểu json
app.use(cors());
app.use('/auth',UserRouter)
app.use('/supplier',SupplierRouter)
app.use('/products',ProductRouter)




mongoose.connect(`${process.env.MONGO_DB}`)
.then(()=>
    {console.log("connect db successfully")})
.catch((err)=>
    {console.log(err)})


app.listen(port,()=>{
    console.log("server is running in port:",+port)
})
