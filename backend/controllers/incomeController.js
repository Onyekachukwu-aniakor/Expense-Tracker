import incomeModel from "../models/incomeModel.js";
import XLSX from 'xlsx';
import getDateRange from "../utils/dataFilter.js";


//ADD INCOME
export const  addIncome = async (req, res) => {
    const userId = req.user._id;
    const {description, amount, category, date}= req.body;
    try {
        if(!description || !amount || !category || !date){
            return res.status(400).json({
                success: false, message: "Required all fields"
            });
        }
        const newIncome = new incomeModel({
            userId,
             description,
              amount,
               category,
                date : new Date(date)
        });
        await newIncome.save();
        res.json({success : true, message: "Income added successfully"})
    } catch (error) {
        console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

// get all income 
export const getAllIncome = async (req, res) => {
    const userId = req.user._id;
    try {
        //{date : -1} shows you the latest date
        const income = await incomeModel.find({userId}).sort({date : -1});
        res.json(income);
    } catch (error) {
        console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

//update an income
export const updateIncome = async (req, res) => {
    const {id} = req.params;
    const userId = req.user._id;
    const {description, amount}= req.body;
    try {
        const updatedIncome = await incomeModel.findOneAndUpdate({ _id:id, userId}, {description, amount}, {new : true});
        if(!updatedIncome){ 
            return res.status(400).json({success: false, message:"Income not found"});
        }
        res.json({success: true, message: "Income updated successfully", data : updatedIncome})
    } catch (error) {
         console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

//Delete income

export const deleteIncome= async (req, res) => {
    try {
        const income = await incomeModel.findByIdAndDelete({_id : req.params.id});
        if(!income){
            return res.status(404).json({success : false, message: "income not found"})
        }
        res.json({success: true, message: "Income deleted successfully"})
    } catch (error) {
         console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

// TO DOWNLOAD data in EXCEL SHEET
export const downloadIncomeExcel= async (req, res) => {
    const userId = req.user._id;
    try {
        const income = await incomeModel.find({userId}).sort({date: -1});
        const plainData = income.map((inc)=>({
            Description : inc.description,
            Amount : inc.amount,
            Category : inc.category,
            Date : new Date(inc.date).toLocaleDateString()
        }));
        //create worksheet
        // 'json_to_sheet()': Converts an array of JS objects to a worksheet.
        //'book_new()' : Creates a new workbook
        //'book_append_sheet()': Append a worksheet to a workbook 
        //'writeFile()': Attempts to write or download workbook data to file
        //'res.download()': Transfer the file at the given path as an attachment.
        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "incomeModel");
        XLSX.writeFile(workbook, "income_details_xlsx");
        res.download("income_details_xlsx")
    } catch (error) {
        console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

//get income overview
export const getIncomeOverview= async (req, res) => {
    try {
        const userId = req.user._id;
        const {range ="monthly"} = req.query;
        const {start, end}= getDateRange(range);

        const incomes = await incomeModel.find({
            userId,
            date:{$gte : start, $lte: end}
        }).sort({date: -1});

  const totalIncome = incomes.reduce((acc, cur) => acc + cur.amount, 0);
const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
const numberOfTransactions = incomes.length;
const recentTransactions = incomes.slice(0, 5);

res.json({success:true, data: {
    totalIncome,
    averageIncome,
    numberOfTransactions,
    recentTransactions,
    range
}})
    } catch (error) {
         console.log(error);
        res.status(500).json({success : false, message: 'Server error'})
    }
}