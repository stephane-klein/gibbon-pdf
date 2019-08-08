import axios from 'axios';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import {
    Button, ButtonToolbar,
    Grid, Row, Col,
    Breadcrumb, BreadcrumbItem,
    ListGroup, ListGroupItem,
    Panel
} from 'react-bootstrap';

import Form from 'react-jsonschema-form';
import withBreadcrumbs from 'react-router-breadcrumbs-hoc';

const apiURL = process.env.REACT_APP_API_URL || `${window.location.href.split('/')[0]}//${window.location.href.split('/')[2]}`;

const routes = [
    { path: '/', breadcrumb: 'Home' },
    {
        path: '/:id',
        breadcrumb: ({ match }) => {
            return match.params.id;
        }
    }
];

const Breadcrumbs = withBreadcrumbs(routes)(({ breadcrumbs }) => (
    <Breadcrumb tag='nav'>
        {breadcrumbs.map(({ match, breadcrumb }) => (
            <BreadcrumbItem active key={match.url}>
                <NavLink to={match.url}>{breadcrumb}</NavLink>
            </BreadcrumbItem>
        ))}
    </Breadcrumb>
));

function App() {
    return (
        <Router>
            <div className='App'>
                <Grid>
                    <Row>
                        <Col>
                            <Breadcrumbs />
                        </Col>
                    </Row>
                    <Route exact path='/' component={Home} />
                    <Route exact path='/:id' component={RessourceForm} />
                </Grid>
            </div>
        </Router>
    );
}

function Home() {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const result = await axios(`${apiURL}/v1/templates/`);
            setTemplates(result.data);
        };

        fetchData();
    }, []);

    return (
        <ListGroup>
            {templates.map(item => (
                <ListGroupItem key={item}><NavLink to={`/${item}/`}>{item}</NavLink></ListGroupItem>
            ))}
        </ListGroup>
    );
}

function RessourceForm({ match }) {
    const [jsonSchema, setJsonSchema] = useState(null);
    const [fieldValues, setFieldValues] = useState({});
    const formEl = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const result = await axios(`${apiURL}/v1/templates/${match.params.id}`);
            setJsonSchema(result.data.json_schema);
        };

        fetchData();
    }, [match.params.id]);

    const submitPreview = useCallback(
        () => {
            setFieldValues(formEl.current.state.formData);
        },
        []
    );

    const submitPdf = useCallback(
        () => {
            setFieldValues(formEl.current.state.formData);
            axios.post(
                `${apiURL}/v1/templates/${match.params.id}/pdf`,
                formEl.current.state.formData,
                {
                    responseType: 'blob'
                }
            ).then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'file.pdf');
                document.body.appendChild(link);
                link.click();
            });
        },
        []
    );

    if (jsonSchema === null) return <p>Loading</p>;

    return (
        <div>
            <Panel>
                <Panel.Heading>Form</Panel.Heading>
                <Panel.Body>
                    <Form
                        schema={jsonSchema}
                        formData={fieldValues}
                        ref={formEl}
                    >
                        <ButtonToolbar className='btn-toolbar pull-right'>
                            <Button
                                bsStyle='primary'
                                onClick={submitPreview}>Preview</Button>
                            <Button
                                onClick={submitPdf}>Download PDF</Button>
                        </ButtonToolbar>
                    </Form>
                </Panel.Body>
            </Panel>
            <Panel>
                <Panel.Heading>HTML Preview</Panel.Heading>
                <Panel.Body>
                    <Preview
                        resourceId={match.params.id}
                        values={fieldValues}
                    />
                </Panel.Body>
            </Panel>
        </div>
    );
}

function Preview({ resourceId, values }) {
    const [previewResult, setPreviewResult] = useState(null);
    const iframeRef = useCallback(node => {
        if (node !== null) {
            setTimeout(() => {
                node.contentDocument.body.innerHTML = previewResult;
            }, 100);
        }
    }, [previewResult]);

    useEffect(() => {
        const fetchData = async () => {
            const result = await axios.post(
                `${apiURL}/v1/templates/${resourceId}/html`,
                values
            );
            setPreviewResult(result.data);
        };
        fetchData();
    }, [resourceId, values]);

    if (previewResult === null) return <p>Loading...</p>;

    return (
        <div>
            <iframe ref={iframeRef} width='100%' height='500px' />
        </div>
    );
}

export default App;
