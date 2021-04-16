import axios from 'axios';
import useAxios from 'axios-hooks';
import React, { useState, useCallback, useRef } from 'react';
import { defaultTo, get } from 'lodash';

const GetByPathWithDefault = (data, path, defaultValue) => defaultTo(get(data, path), defaultValue);
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import {
    Button, ButtonToolbar,
    Container, Row, Col,
    Breadcrumb, BreadcrumbItem,
    ListGroup, ListGroupItem,
    Card
} from 'react-bootstrap';

import Form from '@rjsf/bootstrap-4';
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
                <Container>
                    <Row>
                        <Col>
                            <Breadcrumbs />
                        </Col>
                    </Row>
                    <Route exact path='/' component={Home} />
                    <Route exact path='/:id' component={RessourceForm} />
                </Container>
            </div>
        </Router>
    );
}

function Home() {
    const [
        {
            data: data,
            error: error
        }
    ] = useAxios(
        `${apiURL}/v1/templates/`
    );

    if (error) {
        console.error(error);
        return <p>Error</p>;
    }

    return (
        <ListGroup>
            {(data || []).map(item => (
                <ListGroupItem key={item}><NavLink to={`/${item}/`}>{item}</NavLink></ListGroupItem>
            ))}
        </ListGroup>
    );
}

function RessourceForm({ match }) {
    const [fieldValues, setFieldValues] = useState({});
    const formEl = useRef(null);
    const [
        {
            data: dataTemplate,
            loading: loading,
            error: error
        }
    ] = useAxios(
        `${apiURL}/v1/templates/${match.params.id}`
    );

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

    if (loading) return <p>Loading</p>;
    if (error) {
        console.error(error);
        return <p>Error</p>;
    }

    return (
        <div>
            <Card
                className='mt-3'
            >
                <Card.Header>Form</Card.Header>
                <Card.Body>
                    <Form
                        schema={GetByPathWithDefault(dataTemplate, 'json_schema')}
                        formData={fieldValues}
                        ref={formEl}
                    >
                        <ButtonToolbar
                            className='justify-content-end'
                        >
                            <Button
                                variant="success"
                                className='mr-2'
                                onClick={submitPreview}>Preview</Button>
                            <Button
                                onClick={submitPdf}>Download PDF</Button>
                        </ButtonToolbar>
                    </Form>
                </Card.Body>
            </Card>
            <Card
                className='mt-3'
            >
                <Card.Header>HTML Preview</Card.Header>
                <Card.Body>
                    <Preview
                        resourceId={match.params.id}
                        values={fieldValues}
                    />
                </Card.Body>
            </Card>
        </div>
    );
}

function Preview({ resourceId, values }) {
    const [
        {
            data,
            error
        }
    ] = useAxios(
        {
            url: `${apiURL}/v1/templates/${resourceId}/html`,
            method: 'POST',
            data: values
        }
    );

    const iframeRef = useCallback(node => {
        if (node !== null) {
            setTimeout(() => {
                node.contentDocument.body.innerHTML = data;
            }, 100);
        }
    }, [data]);


    
    if (error) {
        console.error(error);
        return <p>Error</p>;
    }

    return (
        <div>
            <iframe ref={iframeRef} width='100%' height='500px' />
        </div>
    );
}

export default App;
