const pgPromise = require('pg-promise');
const {ParameterizedQuery: PQ} = require('pg-promise');

const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});

function getdata(req, res, next) {
    const db = req.app.locals.db;
    let project = req.query.project;
    let model = req.query.model;
    
    db.any('  SELECT em.doi, \
                           em.embeddings, \
                           lb.label \
                    FROM embeddings AS em \
                    INNER JOIN embeddingmodels AS emm ON emm.embeddingmodelid = em.embeddingmodelid \
                    LEFT JOIN paperlabels AS plb ON plb.doi = em.doi \
                    LEFT JOIN labels AS lb ON lb.labelid = plb.labelid \
                    LEFT JOIN projects AS pr ON pr.projectid = lb.projectid \
                    WHERE (pr.projectname IS NULL OR pr.projectname = ${project}) AND emm.embeddingmodel = ${model};',
                    {'project': project, 'model': model})
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

}

module.exports.getdata = getdata;