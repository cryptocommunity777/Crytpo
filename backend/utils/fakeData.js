// C:\Users\HP\Desktop\Cryptocommunity\backend\utils\fakeData.js
// C:\Users\HP\Desktop\Cryptocommunity\backend\utils\fakeData.js

const names = [
    // 🇮🇳 Indian Names (Male & Female)
    "Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Rohan", "Krishna", "Ishaan", "Shaurya", "Ayaan",
    "Priya", "Ananya", "Diya", "Kavya", "Isha", "Neha", "Riya", "Sneha", "Pooja", "Kriti",
    "Rahul", "Karan", "Vikas", "Amit", "Raj", "Sanjay", "Vikram", "Sunil", "Anil", "Deepak",
    "Ravi", "Suresh", "Ramesh", "Gita", "Sita", "Monika", "Vivek", "Manish", "Ashish", "Kapil",
    "Sachin", "Saurabh", "Gaurav", "Pradeep", "Sandeep", "Mandeep", "Kuldeep", "Harish", "Girish", "Satish",
    "Nitin", "Jatin", "Vipin", "Pravin", "Naveen", "Tarun", "Varun", "Arun", "Kiran", "Chetan",
    "Ketan", "Hemant", "Jayant", "Sushant", "Prashant", "Nishant", "Dushyant", "Siddharth", "Yash", "Harsh",
    "Ayush", "Aman", "Naman", "Bhuvan", "Darshan", "Tushar", "Shekhar", "Sridhar", "Manohar", "Prabhakar",
    "Kamal", "Vimal", "Rajendra", "Surendra", "Virendra", "Mahendra", "Gajendra", "Jitendra", "Dharmendra", "Aarti",
    "Bharti", "Preeti", "Swati", "Jyoti", "Shruti", "Smriti", "Kirti", "Nidhi", "Vidhi", "Riddhi",
    "Siddhi", "Radha", "Sudha", "Anuradha", "Meena", "Teena", "Reena", "Heena", "Sheela", "Leela",
    "Geeta", "Neeta", "Rita", "Anita", "Sunita", "Vinita", "Kavita", "Savita", "Babita", "Namita",
    "Samita", "Amita", "Sushma", "Reshma", "Karishma", "Rani", "Vani", "Kalyani", "Bhavani", "Shivani",
    "Saloni", "Soni", "Moni", "Anjali", "Vaishali", "Sonali", "Rupali", "Deepali", "Mitali", "Chaitali",
    "Shefali", "Rupesh", "Mukesh", "Dinesh", "Ganesh", "Mahesh", "Naresh", "Paresh", "Sukesh", "Brijesh",
    "Kamlesh", "Vimlesh", "Mithilesh", "Akhilesh", "Rakesh", "Lokesh", "Yogesh", "Hitesh", "Nitesh", "Ritesh",
    "Gagan", "Magan", "Chaman", "Raman", "Pawan", "Jeevan", "Madan", "Sadan", "Niranjan", "Manoranjan",
    "Priyanka", "Deepika", "Malika", "Tulika", "Ritika", "Kritika", "Latika", "Geetika", "Radhika", "Vanshika",
    
    // 🌍 US/UK/European Names
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Isabella", "Elijah", "Sophia", "William",
    "Mia", "James", "Amelia", "Benjamin", "Harper", "Lucas", "Evelyn", "Henry", "Abigail", "Alexander",
    "David", "Sarah", "John", "Jessica", "Michael", "Emily", "Daniel", "Lauren", "Matthew", "Ashley",
    "Robert", "Jennifer", "Linda", "Richard", "Susan", "Joseph", "Margaret", "Thomas", "Charles", "Christopher",
    "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
    "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas",
    "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Samuel", "Gregory", "Frank",
    "Raymond", "Patrick", "Jack", "Dennis", "Jerry", "Tyler", "Aaron", "Adam", "Nathan", "Douglas",
    "Zachary", "Peter", "Kyle", "Walter", "Ethan", "Jeremy", "Harold", "Keith", "Christian", "Roger",
    "Gerald", "Carl", "Terry", "Sean", "Austin", "Arthur", "Lawrence", "Jesse", "Dylan", "Bryan",
    "Joe", "Jordan", "Billy", "Bruce", "Albert", "Willie", "Gabriel", "Logan", "Alan", "Wayne",
    "Roy", "Ralph", "Randy", "Eugene", "Vincent", "Russell", "Louis", "Philip", "Bobby", "Johnny",
    "Bradley", "Martin", "Mason", "Jack", "Oliver", "Harry", "Jacob", "Charlie", "Thomas", "George",
    "Oscar", "William", "Noah", "Leo", "Benjamin", "Archie", "Joshua", "Henry", "Isaac", "Samuel",
    "Lily", "Sophie", "Isabella", "Grace", "Evie", "Ruby", "Chloe", "Florence", "Alice", "Daisy",
    
    // 🌍 Spanish / Hispanic Names
    "Carlos", "Maria", "Juan", "Elena", "Diego", "Carmen", "Luis", "Ana", "Jose", "Lucia",
    "Miguel", "Alejandro", "Antonio", "Javier", "Manuel", "Francisco", "David", "Daniel", "Jesus", "Pedro",
    "Victor", "Gabriel", "Rafael", "Alvaro", "Fernando", "Pablo", "Sergio", "Jorge", "Alberto", "Ruben",
    "Ivan", "Enrique", "Ramon", "Julio", "Oscar", "Marcos", "Hugo", "Mario", "Alfonso", "Guillermo",
    "Laura", "Marta", "Cristina", "Paula", "Andrea", "Sara", "Teresa", "Raquel", "Beatriz", "Silvia",
    "Angela", "Julia", "Rosa", "Celia", "Irene", "Clara", "Ines", "Marina", "Rocio", "Gloria",
    
    // 🌍 Asian (Chinese, Japanese, Korean, South East Asian)
    "Wei", "Li", "Zhang", "Min", "Wang", "Jing", "Chen", "Yan", "Yang", "Hui",
    "Liu", "Hong", "Chao", "Dong", "Ming", "Qiang", "Feng", "Jian", "Ping", "Bo",
    "Yuki", "Kenji", "Hiroshi", "Sakura", "Yoko", "Taro", "Akira", "Kazuo", "Naomi", "Midori",
    "Haruto", "Yuto", "Sota", "Yuki", "Hayato", "Hina", "Yui", "Sakura", "Ichika", "Akari",
    "Min-jun", "Seo-jun", "Do-yun", "Ye-jun", "Si-woo", "Ji-ho", "Hae-in", "Ji-a", "Seo-ah", "Ha-yoon",
    "Budi", "Siti", "Agus", "Dewi", "Wayan", "Putu", "Ngo", "Nguyen", "Tran", "Le",
    
    // 🌍 Arabic / Middle Eastern Names
    "Ali", "Fatima", "Omar", "Aisha", "Hassan", "Zainab", "Ahmad", "Maryam", "Tariq", "Khadija",
    "Mohammed", "Hussein", "Ibrahim", "Youssef", "Mahmoud", "Saeed", "Abdullah", "Mustafa", "Khalid", "Hassan",
    "Amir", "Hamza", "Zaid", "Tariq", "Faisal", "Kareem", "Salman", "Rashid", "Adel", "Hisham",
    "Samir", "Nabil", "Kamal", "Jamal", "Nasser", "Hatem", "Tarek", "Yasser", "Walid", "Essam",
    "Salma", "Noura", "Layla", "Hoda", "Mona", "Safa", "Marwa", "Rania", "Rasha", "Nadia",
    "Amira", "Dina", "Hala", "Reem", "Maha", "Nada", "Yasmin", "Farah", "Lina", "Rana",
    
    // 🌍 African / Diverse Global Names
    "Kwame", "Kofi", "Amina", "Nia", "Tariro", "Simba", "Amadou", "Chioma", "Zuri", "Chidi",
    "Sekou", "Thabo", "Lindiwe", "Jabari", "Keita", "Nandi", "Zane", "Aaliyah", "Malik", "Fatoumata",
    "Mamadou", "Oumar", "Awa", "Ibrahim", "Moussa", "Mariam", "Fanta", "Ousmane", "Amadou", "Aissatou",
    "Kaleb", "Elias", "Jonas", "Abel", "Ezra", "Samuel", "Simon", "Yonas", "Dawit", "Natnael",
    
    // 🔥 Extra Filler Professional Names
    "Aaron", "Abbot", "Abel", "Abner", "Abraham", "Ace", "Adalberto", "Adam", "Adan", "Adolph",
    "Adolfo", "Adrian", "Agustin", "Ahmad", "Ahmed", "Al", "Alan", "Albert", "Alberto", "Alden",
    "Alec", "Alfonso", "Alford", "Alfred", "Ali", "Allan", "Allen", "Alonso", "Alonzo", "Alphonse",
    "Bailey", "Barbie", "Barbara", "Beatrice", "Becky", "Bella", "Bessie", "Beth", "Betsy", "Betty",
    "Blake", "Blanca", "Bobbie", "Bonnie", "Brandi", "Brenda", "Brianna", "Bridget", "Brittany", "Brooke",
    "Caleb", "Calvin", "Cameron", "Carl", "Carlos", "Carlton", "Carmine", "Cary", "Casey", "Cecil",
    "Cedric", "Cesar", "Chad", "Charles", "Chase", "Chester", "Chris", "Christian", "Chuck", "Clarence",
    "Daisy", "Dana", "Danielle", "Darla", "Darlene", "Dawn", "Deanna", "Debbie", "Deborah", "Delia",
    "Denise", "Diana", "Diane", "Dixie", "Dominique", "Donna", "Dora", "Doris", "Dorothy", "Ebony",
    "Fabian", "Felipe", "Felix", "Fernando", "Fidel", "Fletcher", "Floyd", "Forest", "Frank", "Frankie",
    "Franklin", "Fred", "Freddie", "Frederick", "Gabriel", "Gage", "Garrett", "Garry", "Gary", "Gavin",
    "Gloria", "Grace", "Gwendolyn", "Hailey", "Hannah", "Harriet", "Hazel", "Heather", "Heidi", "Helen",
    "Jack", "Jackson", "Jacob", "Jake", "Jamal", "James", "Jamie", "Jared", "Jason", "Jasper",
    "Jackie", "Jacqueline", "Jamie", "Jane", "Janet", "Janice", "Jean", "Jeanette", "Jeanne", "Jennie",
    "Keith", "Kelvin", "Ken", "Kendall", "Kendrick", "Kenneth", "Kent", "Kermit", "Kevin", "Kirk",
    "Karen", "Karla", "Kate", "Katelyn", "Katherine", "Kathleen", "Kathryn", "Kathy", "Katie", "Kayla",
    "Larry", "Lawrence", "Lee", "Leo", "Leon", "Leonard", "Leroy", "Lester", "Levi", "Lewis",
    "Lacy", "Lana", "Latoya", "Laura", "Lauren", "Leah", "Leslie", "Letitia", "Lillian", "Lillie",
    "Mac", "Malcolm", "Manuel", "Marc", "Marco", "Marcus", "Mario", "Marion", "Mark", "Marlon",
    "Mabel", "Madeline", "Mae", "Maggie", "Mandy", "Marcia", "Margaret", "Maria", "Marian", "Marie",
    "Neil", "Nelson", "Nestor", "Nicholas", "Nick", "Nicolas", "Nigel", "Noah", "Nolan", "Norman",
    "Nadia", "Nancy", "Naomi", "Natalia", "Natalie", "Natasha", "Nellie", "Nettie", "Nicole", "Nina",
    "Pablo", "Parker", "Patrick", "Paul", "Pedro", "Perry", "Pete", "Peter", "Phil", "Philip",
    "Pamela", "Patricia", "Patsy", "Paula", "Paulette", "Pearl", "Peggy", "Penny", "Phyllis", "Polly"
];

const countries = [
    "IN", "US", "GB", "AE", "PK", "BD", "NG", "BR", "ZA", "CA", 
    "AU", "SA", "DE", "FR", "IT", "SG", "MY", "PH", "ID", "ES"
];

module.exports = { names, countries };