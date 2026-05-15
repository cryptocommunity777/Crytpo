// C:\Users\HP\Desktop\Cryptocommunity\backend\utils\fakeData.js

const names = [
    // 🇮🇳 Indian Names (Common & Regular - Male & Female)
    "Aarav Sharma", "Vihaan Patel", "Aditya Singh", "Arjun Kumar", "Sai Gupta", "Rohan Verma", "Krishna Reddy", "Ishaan Yadav",
    "Priya Mishra", "Ananya Joshi", "Diya Choudhary", "Kavya Pandey", "Isha Rajput", "Neha Das", "Riya Chauhan", "Sneha Thakur",
    "Rahul Malhotra", "Karan Dubey", "Vikas Tiwari", "Amit Saxena", "Raj Bhatia", "Sanjay Kapoor", "Vikram Kadam", "Sunil Nair",
    "Gita Iyer", "Sita Pillai", "Monika Menon", "Vivek Bose", "Manish Ghosh", "Ashish Sanyal", "Kapil Chatterjee", "Sachin Roy",
    "Aman Khan", "Sameer Verma", "Abhishek Jain", "Rajat Sharma", "Tarun Kumar", "Nitin Agarwal", "Prakash Singh", "Dinesh Patel",
    "Ramesh Gupta", "Suresh Reddy", "Mahesh Yadav", "Kamlesh Tiwari", "Ganesh Mishra", "Dharmendra Joshi", "Jitendra Choudhary",
    "Surendra Pandey", "Virendra Rajput", "Rajendra Das", "Mahendra Chauhan", "Yogendra Thakur", "Bhupendra Malhotra", "Gajendra Dubey",
    "Mohit Chawla", "Pramod Soni", "Anil Meena", "Deepak Verma", "Ravi Solanki", "Gaurav Sinha", "Saurabh Ahuja", "Naveen Bhatia",
    "Ankur Mistry", "Ritesh Jha", "Anil Sharma", "Sunil Kumar", "Vikas Singh", "Deepak Gupta", "Ravi Patel", "Suresh Kumar",
    "Pooja Sharma", "Kriti Verma", "Sneha Patel", "Riya Gupta", "Neha Singh", "Isha Tiwari", "Priya Yadav", "Kavya Chauhan",
    "Rakesh Sharma", "Rajesh Kumar", "Ramesh Verma", "Dinesh Singh", "Ganesh Patel", "Mahesh Gupta", "Kamlesh Yadav", "Suresh Tiwari",
    "Ankita Sharma", "Komal Patel", "Priyanka Singh", "Shikha Verma", "Jyoti Gupta", "Neha Yadav", "Pooja Chauhan", "Kavita Tiwari",
    "Rahul Singh", "Sanjay Verma", "Amit Patel", "Rajesh Gupta", "Vikram Yadav", "Suresh Chauhan", "Ravi Tiwari", "Dinesh Sharma",
    "Sonia Singh", "Divya Verma", "Nidhi Patel", "Ritu Gupta", "Sneha Yadav", "Pooja Chauhan", "Kavita Tiwari", "Neha Sharma",
    "Ashish Kumar", "Vivek Sharma", "Naveen Verma", "Pramod Patel", "Gaurav Gupta", "Saurabh Yadav", "Mohit Chauhan", "Ravi Tiwari",

    // 🇿🇦 South African Names (Common Local Names)
    "Thabo Ndlovu", "Sipho Dlamini", "Lindiwe Khumalo", "Zanele Zuma", "Kagiso Mthembu", "Nomsa Ngcobo", "Lungile Nkosi", "Bongani Baloyi",
    "Nandi Sithole", "Siyabonga Buthelezi", "Jabari Mofokeng", "Thandiwe Mabaso", "Sanele Mkhize", "Mandla Gumede", "Zola Zungu",
    "Sibusiso Zwane", "Themba Ndabandaba", "Thandeka Nxumalo", "Siyabulela Mncube", "Nompumelelo Cele", "Bheki Ramaphosa", "Jacob Motlanthe",
    "Vusi Molefe", "Tshepo Modise", "Kabelo Mokoena", "Tebogo Nhlapo", "Lerato Mahlangu", "Karabo Kgosana", "Mpho Sibiya", "Palesa Hadebe",

    // 🇳🇬 Nigerian & Ghanaian Names (Common Local Names)
    "Chinedu Okafor", "Emeka Obi", "Ibrahim Musa", "Tunde Adebayo", "Olumide Balogun", "Uche Eze", "Kelechi Nwosu", "Seyi Adekunle",
    "Ifeanyi Okeke", "Nnamdi Ekwueme", "Samuel Bello", "David Ibrahim", "Daniel Yakubu", "Joseph Abdullahi", "Michael Garba", 
    "Kwame Mensah", "Kofi Osei", "Amina Asare", "Chioma Appiah", "Ousmane Dembele", "Amadou Diallo", "Fanta Diop", "Moussa Sissoko",
    "Abubakar Sani", "Yusuf Usman", "Hassan Mohammed", "Aliyu Abubakar", "Umar Farouk", "Aishatu Bello", "Fatima Isa", "Zainab Umar",

    // 🌍 Asian & Middle Eastern (PK, BD, LK, VN, MY)
    "Ali Khan", "Hassan Ahmed", "Fatima Ali", "Omar Rahman", "Tariq Hussain", "Ayesha Siddiqui", "Zainab Malik", "Usman Sheikh",
    "Budi Santoso", "Siti Aminah", "Agus Setiawan", "Dewi Lestari", "Wayan Suartini", "Nguyen Van An", "Tran Thi Mai", "Le Van Minh",
    "Mohammed Perera", "Kamal Silva", "Dilshan Fernando", "Nuwan Rathnayake", "Ahmad Reza", "Salman Nazir", "Imran Akhtar", "Shoaib Azam",
    "Bilal Qureshi", "Zahid Mahmood", "Rizwan Ullah", "Farhan Saeed", "Mehmood Ali", "Syed Bukhari", "Azizur Rahman", "Habibul Bashar"
];

// ✅ 50% India, 30% South Africa, 20% Mixed (NG, PK, BD, LK, MY, VN, GH, KE)
const countries = [
    // 50% IN (India)
    "IN","IN","IN","IN","IN","IN","IN","IN","IN","IN",
    "IN","IN","IN","IN","IN","IN","IN","IN","IN","IN",
    "IN","IN","IN","IN","IN","IN","IN","IN","IN","IN",
    "IN","IN","IN","IN","IN","IN","IN","IN","IN","IN",
    "IN","IN","IN","IN","IN","IN","IN","IN","IN","IN",
    
    // 30% ZA (South Africa)
    "ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA",
    "ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA",
    "ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA","ZA",

    // 20% Others (Mix of Nigeria, Pakistan, Bangladesh, Sri Lanka, Malaysia, Vietnam, Ghana, Kenya)
    "NG","NG","NG",  // 3% Nigeria
    "PK","PK","PK",  // 3% Pakistan
    "BD","BD","BD",  // 3% Bangladesh
    "LK","LK","LK",  // 3% Sri Lanka
    "MY","MY",       // 2% Malaysia
    "VN","VN",       // 2% Vietnam
    "GH","GH",       // 2% Ghana
    "KE","KE"        // 2% Kenya
];

module.exports = { names, countries };