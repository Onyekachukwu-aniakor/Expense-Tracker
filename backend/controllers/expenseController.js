import expenseModel from "../models/expenseModel.js";
import XLSX from 'xlsx';
import getDateRange from '../utils/dataFilter.js'

//add expense 
export const addExpense = async (req, res) => {
    const userId = req.user._id;
    const {description, amount, category, date}= req.body;
    try {
        if(!description || !amount || !category || !date){
            return res.status(400).json({
                success: false, message: "Required all fields"
            })
        }
        const newExpense = new expenseModel({
            userId, description, amount, category, date : new Date(date)
        });
        await newExpense.save();
        res.json({success : true, message: "Expense added successfully"})
    } catch (error) {
        console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

//get all expense
export const getAllExpense = async (req, res) => {
    const userId = req.user._id;
    try {
        //{date : -1} shows you the latest date
        const expense = await expenseModel.find({userId}).sort({date : -1})
        res.json(expense)
    } catch (error) {
        console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

//update expense
export const updateExpense = async(req, res) => {
    const {id} = req.params;
    const userId = req.user._id;
    const {description, amount}= req.body;
    try {
        const updatedExpense = await expenseModel.findOneAndUpdate({_id:id, userId}, {description, amount}, {new : true});
        if(!updatedExpense){ return res.status(400).json({success: false, message:"Expense not found"})}
        res.json({success: true, message: 'Income updated successfully', data : updatedExpense})
    } catch (error) {
         console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

//delete expense
export const deleteExpense= async (req, res) => {
    try {
        const expense = await expenseModel.findByIdAndDelete({ _id : req.params.id});
        if(!expense){
            return res.status(404).json({success : false, message: "expense not found"})
        }
        res.json({success: true, message: "Expense deleted successfully"})
    } catch (error) {
         console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}


// download excel for expense
export const downloadExpenseExcel = async (req, res) => {
    const userId = req.user._id;
    try {
        const expense = await expenseModel.find({userId}).sort({date: -1});
        const plainData = expense.map((exp)=>({
            Description : exp.description,
            Amount : exp.amount,
            Category : exp.category,
            Date : new Date(exp.date).toLocaleDateString(),
        }));
        //create worksheet
        // 'json_to_sheet()': Converts an array of JS objects to a worksheet.
        //'book_new()' : Creates a new workbook
        //'book_append_sheet()': Append a worksheet to a workbook 
        //'writeFile()': Attempts to write or download workbook data to file
        //'res.download()': Transfer the file at the given path as an attachment.
        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "expenseModel");
        XLSX.writeFile(workbook, "expense_details_xlsx");
        res.download("expense_details_xlsx")
    } catch (error) {
        console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}

// get expense overview
export const getExpenseOverview = async (req, res) => {
    try {
        const userId = req.user._id;
        const {range ='monthly'} = req.query;
        const {start, end}= getDateRange(range);

        const expense = await expenseModel.find({
      userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);
    const averageExpense =
      expense.length > 0 ? totalExpense / expense.length : 0;
    const numberOfTransactions = expense.length;
const recentTransactions = expense.slice(0, 5);

res.json({success:true, data: {
    totalExpense,
    averageExpense,
    numberOfTransactions,
    recentTransactions,
    range
}})
    } catch (error) {
         console.log(error);
        res.status(500).json({success : false, message: "Server error"})
    }
}