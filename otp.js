const searcStudents=async(req,res)=>{
    try{
        const {course,minMarks}=req.query;
    if(!course||!minMarks){
        return res.status(400).json({message:"Course and Minmarks are required"})
    }
    if(course!=null && minMarks!=null){
    const res=await searcStudents.find({course:{course},marks:{$gte:{minMarks}}});
    return res.status(200).json({message:res})
    }
    else if(course!=null){
    const res=await searcStudents.find({course:course});
     return res.status(200).json({message:res})
    }
    else if(minMarks!=null){
    const res=await searcStudents.find({marks:{$gte:Number({minMarks})}});
    return res.status(200).json({message:res})
    }
    }catch(err){
        res.status(500).json({message:err.message})
    }

}