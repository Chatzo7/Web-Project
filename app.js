const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(fileUpload());

const mysql = require('mysql2');
const pool = mysql.createPool({ host: 'localhost', user: 'root', database: 'ceid_project' });
const myDatabase = pool.promise();


let loggedInUser = {
    loggedInUserId: 1,
    loggedInUserUsername: '',
    loggedInUserEmail: '',
}


// ka8orizei oti anti gia html 8a xrisimopoioume ejs.
app.set('view enigne', 'ejs')
app.set('views', './views')

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


app.get('/editprofile', (req, res) => {
    res.render('editprofile.ejs')

})

app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.get('/register', (req, res) => {
    res.render('register.ejs')
})

app.get('/userpage', (req, res) => {
    res.render('userpage.ejs')
})

app.get('/adminpage', (req, res) => {
    res.render('adminpage.ejs')
})


app.post('/signin', async function (req, res) {
    console.log(req.body)
    const email = req.body.email
    const password = req.body.password

    const resp = await myDatabase.query(`SELECT * FROM users WHERE email='${email}' AND password='${password}'`)
    if (resp[0].length > 0) {
        loggedInUser.loggedInUserUsername = resp[0][0].username
        loggedInUser.loggedInUserId = resp[0][0].userID
        loggedInUser.loggedInUserEmail = resp[0][0].email
        if (resp[0][0].isAdmin) {
            res.redirect('/adminpage')
        } else {
            res.redirect('/userpage')

        }
    } else {

        res.status(401).send('wrong data')
    }
})

app.post('/register', async function (req, res) {
    console.log(req.body);
    const email = req.body.email
    const password = req.body.password;
    const username = req.body.username;


    try {
        const resp = await myDatabase.query(`INSERT INTO users(username, password, email, isAdmin) VALUES('${username}','${password}','${email}', 0)`)
        res.status(200).send('Εγγραφήκατε Επιτυχως')
    } catch (error) {
        console.log(error);
        res.status(403).send('Εχετε ήδη εγγεγραφει')

    }

})

app.post('/upload_data', async function (req, res) {
    const file = req.files.file1;
    console.log(file);
    const parseJson = JSON.parse(file.data);
    console.log(parseJson);

    const extract_desiredData = parseJson.map(poi => {
        return {
            givenId: poi.id,
            name: poi.name,
            address: poi.address,
            types: poi.types,
            coordinates: poi.coordinates,
            populartimes: poi.populartimes
        }
    });
    console.log(extract_desiredData);
    // return;
    extract_desiredData.map(async entry => {
        const sql = `INSERT INTO points_of_interest(givenId,name,address,coordinates,types) VALUES(\'${entry.givenId}\',\'${entry.name}\',\'${entry.address}\',Point(${entry.coordinates.lat},${entry.coordinates.lng}),'${JSON.stringify(entry.types)}' )`
        try {
            const resp = await myDatabase.query(sql);

            resp[0].insertId;
            entry.populartimes.map(async (a) => {
                const sqlPopular = `INSERT INTO poi_popular_times(pointId, \`day\`,
                hour_0,
                hour_1,
                hour_2,
                hour_3,
                hour_4,
                hour_5,
                hour_6,
                hour_7,
                hour_8,
                hour_9,
                hour_10,
                hour_11,
                hour_12,
                hour_13,
                hour_14,
                hour_15,
                hour_16,
                hour_17,
                hour_18,
                hour_19,
                hour_20,
                hour_21,
                hour_22,
                hour_23)
                VALUES(${resp[0].insertId},
                     '${a.name}',
                    '${a.data[0]}',
                    '${a.data[2]}',
                    '${a.data[3]}',
                    '${a.data[4]}',
                    '${a.data[5]}',
                    '${a.data[6]}',
                    '${a.data[7]}',
                    '${a.data[8]}',
                    '${a.data[9]}',
                    '${a.data[10]}',
                    '${a.data[11]}',
                    '${a.data[12]}',
                    '${a.data[13]}',
                    '${a.data[14]}',
                    '${a.data[15]}',
                    '${a.data[16]}',
                    '${a.data[17]}',
                    '${a.data[18]}',
                    '${a.data[19]}',
                    '${a.data[20]}',
                    '${a.data[21]}',
                    '${a.data[22]}',
                    '${a.data[23]}',
                    '${a.data[23]}'                    
                    )`
                const respaaa = await myDatabase.query(sqlPopular);

            })

        } catch (error) {
            console.log(error);
        }
    })


    res.send('Τα δεδομένα έχουν μπεί μοναδικά στην βάση')
})


app.delete("/delete_all", async function (req, res) {

    try {
        await myDatabase.query(`DELETE from infected_users`)
        await myDatabase.query(`DELETE from poi_popular_times`)
        await myDatabase.query(`DELETE from points_of_interest`)
        await myDatabase.query(`DELETE from uservisitedpoint `)
        res.send('ok')

    } catch (error) {

        res.status(401).send('not_ok')
    }
})

app.get('/bring_data', async function (req, res) {

    const todayName = new Date().toLocaleString("default", { weekday: "long" })
    const params = req.query.param;
    console.log(params, '123q');
    const sql = `SELECT * FROM points_of_interest
     INNER JOIN poi_popular_times on points_of_interest.pointId=poi_popular_times.pointId
     WHERE types LIKE '%${params}%' AND day='${todayName}'`;
    console.log(sql);
    const data = await myDatabase.query(sql)
    console.log(data[0]);

    const allPois = data[0].map(point => {
        const { pointId,
            givenId,
            name,
            types,
            address,
            coordinates,
            pt_id, day, ...rest } = point


        const popularity = {
            day: day,
            value: Object.values(rest)
        }


        // console.log(popularity)
        const point_of_interest = {
            pointId: pointId,
            givenId: givenId,
            name: name,
            types: JSON.parse(types),
            address: address,
            coordinates: coordinates,
            pt_id: pt_id,
            popularity: popularity
        }
        return point_of_interest;
    })


    console.log(allPois);

    res.send(allPois)
})

app.post('/uservisited', async function (req, res) {
    const pointId = req.body.pointId;
    const numberOfPeople = req.body.numberOfPeople || null;

    const sql = `INSERT INTO userVisitedPoint(pointId,timestamp,userID, numberOfUsers) VALUES(${pointId}, now(), ${loggedInUser.loggedInUserId}, ${numberOfPeople})`
    console.log(sql);
    const response = await myDatabase.query(sql)
    console.log(response);
    if (response[0].affectedRows > 0) {
        res.status(200).send('Submited Successfully')
    } else {
        res.status(500).send('something went wrong')
    }
})

app.post('/submitCovid', async function (req, res) {

    let newDate = req.body.date;
    const sql1 = `SELECT infected_date from infected_users where userID=${loggedInUser.loggedInUserId} ORDER BY infected_date DESC;`
    const response1 = await myDatabase.query(sql1)
    let lastDate = response1[0][0]?.infected_date;

    console.log(newDate, 'herer11');
    const _newDate = newDate;
    lastDate = lastDate ? new Date(lastDate) : new Date();
    newDate = new Date(newDate)
    console.log(newDate, 'herer');
    if (Math.ceil(Math.abs(newDate - lastDate) / (1000 * 60 * 60 * 24)) > 14) {

        const sql = `INSERT INTO infected_users(userID ,isInfected, infected_date) VALUES(${loggedInUser.loggedInUserId}, 1, '${_newDate}')`
        console.log(sql, loggedInUser.loggedInUserId);

        const response = await myDatabase.query(sql)

        if (response[0].affectedRows > 0) {
            res.status(200).send('Submited Successfully')
        } else {
            res.status(500).send('something went wrong')
        }
    } else {
        res.status(201).send('Not enough Days passed')
    }
    res.send()
})


app.post('/editprofile', async function (req, res) {
    const userInfoToChange = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
    }

    let thingsToChange = [
        userInfoToChange.email ? 'email' : '',
        userInfoToChange.username ? 'username' : '',
        userInfoToChange.password ? 'password' : '',
    ];

    thingsToChange = thingsToChange.filter(thing => thing)

    console.log(thingsToChange);
    let sql = `UPDATE users set `
    thingsToChange.forEach((thing, index, array) => sql += `${thing}='${userInfoToChange[thing]}'${array[index + 1] ? ',' : ''}`)
    sql += `WHERE userID=${loggedInUser.loggedInUserId}`;

    const dbResp = await myDatabase.query(sql);

    if (dbResp[0].affectedRows > 0) {
        res.status(200).send('Profile Updated Successfully')
    } else {
        res.status(500).send('something went wrong')
    }

    console.log(sql);

})

app.get('/visite_place', async function (req, res) {

    const sql = `SELECT DISTINCT name FROM points_of_interest INNER JOIN uservisitedpoint on points_of_interest.pointId=uservisitedpoint.pointId where userID=${loggedInUser.loggedInUserId}`
    const dbResp = await myDatabase.query(sql);

    const sqlCovid = `SELECT isInfected, infected_date FROM infected_users where userID=${loggedInUser.loggedInUserId}`
    const dbResp1 = await myDatabase.query(sqlCovid);

    res.status(200).send({ data: dbResp[0], covidArray: dbResp1[0] })
})

app.get('/admin_data', async function (req, res) {
    const total_visits = `SELECT count(*) as totalVisits FROM uservisitedpoint`
    const total_covid = `SELECT count(*) as totalInfections FROM infected_users`
    const popularPois = `select points_of_interest.pointId, count(points_of_interest.pointId) as totalVisits, types
    from users 
    inner join uservisitedpoint 
    on users.userID = uservisitedpoint.userID 
    inner join points_of_interest 
    on uservisitedpoint.pointId = points_of_interest.pointId 
    group by pointId 
    order by totalVisits desc`;

    const popularCovidPois = `select points_of_interest.pointId, count(points_of_interest.pointId) as totalVisits, types, isInfected
    from users 
    inner join uservisitedpoint 
    on users.userID = uservisitedpoint.userID 
    inner join points_of_interest 
    on uservisitedpoint.pointId = points_of_interest.pointId 
    inner join infected_users
    on infected_users.userID = users.userID
    where isInfected=1 and
    Date(timestamp) > date_sub(infected_date, interval 7 day) and Date(timestamp) < date_add(infected_date, interval 14 day) 
    group by pointId 
    order by totalVisits desc
    `

    const resp1 = await myDatabase.query(total_visits) //a
    const resp2 = await myDatabase.query(total_covid)  //b
    const resp3 = await myDatabase.query(popularPois); //c
    const resp4 = await myDatabase.query(popularCovidPois); //c


    // resp3 .......
    resp3[0].map(point => point.types = JSON.parse(point.types));

    const myArray = [] // this array has all the times n times, where n is the number of times this point has been visited
    resp3[0].map(point => point.types.map(type => myArray.push(type)))

    const counts = {};
    // count how many times each item will be in the array
    for (const num of myArray) {
        counts[num] = counts[num] ? counts[num] + 1 : 1;
    }


    //resp4..........
    resp4[0].map(point => point.types = JSON.parse(point.types));

    const myArray2 = [] // this array has all the times n times, where n is the number of times this point has been visited
    resp4[0].map(point => point.types.map(type => myArray2.push(type)))

    const counts2 = {};
    // count how many times each item will be in the array
    for (const num of myArray2) {
        counts2[num] = counts2[num] ? counts2[num] + 1 : 1;
    }



    res.send({
        totalVisits: resp1[0][0].totalVisits,
        totalInfections: resp2[0][0].totalInfections,
        popularity: counts,
        popularityInfected: counts2
    })
})

app.get('/haveIVisitedInfectedPlace', async function (req, res) {
    const userId = loggedInUser.loggedInUserId
    const a = `SELECT userID, pointId, timestamp from uservisitedpoint WHERE userID=${userId}`
    const resp = await myDatabase.query(a)
    const userVisitedThesePlaces = resp[0]
   let infectedPlaces=  await Promise.all (userVisitedThesePlaces.map(async x => {
        const infectedPoints = `SELECT timestamp, name FROM uservisitedpoint uv  
        inner join 
        infected_users iu
        on uv.userID=iu.userID
        inner join points_of_interest
        on points_of_interest.pointId=uv.pointId
        where 
            iu.userID<>${x.userID}  
        AND uv.pointId=${x.pointId}
        AND TIMESTAMPDIFF(HOUR,uv.timestamp, cast('${x.timestamp}' as DATETIME)) <2 
        AND Date(timestamp) > date_sub(infected_date, interval 7 day) and Date(timestamp) < date_add(infected_date,interval 14 day)`
        const resp = await myDatabase.query(infectedPoints)
        if(resp[0].length > 0 ){
            return resp[0][0]
        }
    
    }));

    infectedPlaces = infectedPlaces.filter(x=>x);// eliminate undefined
    res.status(200).send(infectedPlaces)
})