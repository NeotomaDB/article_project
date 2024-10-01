const pgPromise = require('pg-promise');
const {ParameterizedQuery: PQ} = require('pg-promise');

const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});

function registerperson(req, res, next) {
    const db = req.app.locals.db;
    const data = JSON.parse(req.body.data)
    const orcid = 'https://orcid.org/' + data['person']
    console.log(`https://api.openalex.org/authors/${orcid}?select=display_name`)

    fetch(`https://api.openalex.org/authors/${orcid}?select=display_name`, {
        method: "GET",
        headers: {'mailto': process.env.MAILTO, 'accept':'application/json'}
        })
    .then(function(data) {
        return data.json()
    })
    .then(function(response) {
        db.oneOrNone("INSERT INTO people(orcid, personname) VALUES (${orcid}, ${name}) \
                ON CONFLICT DO NOTHING;",
            {'orcid': orcid, 'name': response.display_name}
        )
        .then(function(data) {
            return res.status(200)
            .json({'status': 'success',
                   'data': {'orcid': orcid, 'display_name': response.display_name}
            })
        })
        .catch(function(err) {
            return res.status(500)
                .json({error: err.message})
        })
    })
    .catch(function(err) {
        return res.status(500)
            .json({error: err.message})
    })
};
  
function checkperson(req, res, next) {
    const db = req.app.locals.db;
    let orcid = req.query.orcid;
    orcid = 'https://orcid.org/' + orcid;
    db.oneOrNone('SELECT ps.orcid, ps.personname \
        FROM people AS ps \
        WHERE ps.orcid = ${orcid};', {'orcid': orcid})
        .then(function(data) {
        return res.status(200)
            .json({
            status: 'success',
            data: data
            })
        })
        .catch(function(err) {
        return res.status(500)
            .json({
            'status': 'failure',
            'data': 'no result'
            })
        })
};

module.exports.checkperson = checkperson;
module.exports.registerperson = registerperson;
