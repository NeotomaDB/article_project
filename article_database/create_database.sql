CREATE EXTENSION vector;

CREATE DOMAIN doi AS TEXT
CHECK (VALUE ~* '^10.\d{4,9}/[-._;()/:A-Z0-9]+$');
COMMENT ON DOMAIN doi IS 'match DOIs (from shoulder)';

CREATE DOMAIN url AS TEXT
CHECK (VALUE ~ 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,255}\.[a-z]{2,9}\y([-a-zA-Z0-9@:%_\+.,~#?!&>//=]*)$');
COMMENT ON DOMAIN url IS 'match URLs (http or https)';

CREATE DOMAIN orcidurl AS TEXT CHECK (VALUE ~* 'https://orcid\.org/[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]{1}'::text);
COMMENT ON TYPE public.orcidurl IS 'ORCIDs as defined in ORCID documentation: https://support.orcid.org/hc/en-us/articles/360006897674-Structure-of-the-ORCID-Identifier';

CREATE TABLE papers (
    doi doi,
    title text,
    subtitle text,
    author text,
    subject text,
    abstract text,
    containertitle text,
    language text,
    published text,
    publisher text,
    articleurl url,
    crossrefmeta jsonb,
    dateadded date,
    PRIMARY KEY (doi)
);

CREATE TABLE embeddingmodels (
    embeddingmodelid SERIAL PRIMARY KEY,
    embeddingmodel text,
    embeddingdescription text,
    dateadded date,
    UNIQUE(embeddingmodel)
);

create table embeddings (
    doi doi REFERENCES papers(doi),
    embeddingmodelid INT REFERENCES embeddingmodels(embeddingmodelid),
    embeddings public.vector,
    date timestamp,
    UNIQUE(doi, embeddingmodelid)
);

create table people (
    orcid orcidurl PRIMARY KEY,
    personname text
);

create table projects (
    projectid SERIAL PRIMARY KEY,
    projectname text,
    projectdescription text,
    dateadded date,
    UNIQUE(projectname, projectdescription)
);

create table labels (
    labelid SERIAL primary key,
    projectid INT REFERENCES projects(projectid),
    label text CONSTRAINT no_null NOT NULL,
    labelnotes text,
    labeladded date,
    UNIQUE(label, projectid)
);

create table paperlabels (
    doi doi REFERENCES papers(doi),
    labelid INT REFERENCES labels(labelid),
    orcid orcidurl REFERENCES people(orcid),
    dateadded date,
    UNIQUE(doi, labelid, orcid)
);

create table models (
    modelid SERIAL PRIMARY KEY,
    modeltype text,
    modelparams jsonb,
    modeljoblib bytea,
    dateadded date,
    UNIQUE(modeltype, modelparams, dateadded)
);

create table modeltrains (
    modelid INT REFERENCES models(modelid),
    doi doi REFERENCES papers(doi),
    trainedlabel INT REFERENCES labels(labelid),
    predictedlabel INT REFERENCES labels(labelid),
    dateadded date
);