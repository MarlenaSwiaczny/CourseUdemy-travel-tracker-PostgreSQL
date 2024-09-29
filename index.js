import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
let countries = [];
let total = null;
env.config();

// hasła trzymamy w zmiennych środowiskowych w pliku .env
// należy 

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// poprawka ai
app.set("view engine", "ejs");


app.get("/", async (req, res) => {
  
  const result = await db.query("SELECT country_code FROM visited_countries");
  let data = result.rows;
  countries = data.map(item => item.country_code);
  total = result.rowCount;
  console.log("/", countries, total);
  
  res.render("index.ejs", {
  "countries": countries,
  "total": total})
});

// wartości możemy wstawiać w kod przy pomocy:
// db.query("INSERT INTO world_food
// (country, rice_production, wheat_production)
// VALUES ($1, $2, $3"),
// --> i po przecinku wstawiamy wartości, np: <-- ["Italy", 1.46, 7.3]);

app.post("/add", async (req, res) => {
  
  console.log(req.body.country);
  let myQuery = `SELECT * FROM countries WHERE LOWER(country_name) LIKE '%' || '${req.body.country.toLowerCase()}' || '%'`
  console.log(myQuery)
  const searchCountry = await db.query(myQuery);
  console.log("Searched: ", searchCountry.rows);
  
  console.log(searchCountry.rows.length)
    if (searchCountry.rows.length > 0) {
      let newCode = searchCountry.rows[0].country_code
      console.log(newCode)
      try {
        await db.query(`INSERT INTO visited_countries (country_code) VALUES ($1)`, [newCode])
        res.redirect("/");
      } catch (err) {
        console.log(err)
        res.render("index.ejs", {
          "countries": countries,
          "total": total,
          "error": "Country has already been added before"
        })
      }
      
    } else {
      res.render("index.ejs", {
        "countries": countries,
        "total": total,
        "error": "Country not found"
      })
    }
    
    
});

// dodatkowy kod z czatu ai, zamykanie połączenia:
// Zamknięcie połączenia przy zamknięciu aplikacji

process.on('SIGINT', () => {
  db.end(() => {
    console.log('Połączenie do bazy danych zostało zamknięte.');
    process.exit(0);
  });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
