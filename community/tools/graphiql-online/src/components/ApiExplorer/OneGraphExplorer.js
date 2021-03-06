import React from 'react';
import { getIntrospectionQuery, buildClientSchema } from 'graphql';
import { getHeadersAsJSON } from './utils';
import GraphiQLExplorer from 'graphiql-explorer-hasura';
import './GraphiQL.css';
import './OneGraphExplorer.css';
import {
  makeDefaultArg,
  getDefaultScalarArgValue,
  getExplorerWidthFromLocalStorage,
  setExplorerWidthInLocalStorage,
} from './onegraphUtils';

class OneGraphExplorer extends React.Component {
  state = {
    explorerOpen: false,
    explorerWidth: getExplorerWidthFromLocalStorage(),
    explorerClientX: null,
    schema: null,
    query: this.props.query || '',
    isResizing: false,
    headers: [],
  };

  componentDidMount() {
    this.introspect();
  }

  componentDidUpdate() {
    if (this.shouldIntrospect(this.props.headers, this.state.headers)) {
      this.introspect()
    }
  }

  shouldIntrospect(newHeadersArray, oldHeadersArray) {
    if (this.props.headerFocus) {
      return false;
    }
    const oldHeaders = getHeadersAsJSON(oldHeadersArray);
    const headers = getHeadersAsJSON(newHeadersArray);
    if (Object.keys(oldHeaders).length !== Object.keys(headers).length) {
      return true;
    }
    for (var i = Object.keys(headers).length - 1; i >= 0; i--) {
      const key = Object.keys(headers)[i];
      const value = headers[key];
      if (oldHeaders[key] !== value) {
        return true;
      }
    }
    return false;
  }

  introspect() {
    const { endpoint, headers } = this.props;
    fetch(endpoint, {
      method: 'POST',
      headers: getHeadersAsJSON(headers || []),
      body: JSON.stringify({
        query: getIntrospectionQuery(),
      }),
    })
      .then(response => response.json())
      .then(result => {
        this.setState({
          schema: buildClientSchema(result.data),
          headers: JSON.parse(JSON.stringify(headers))
        });
      })
      .catch(error => {
        this.setState({
          schema: null,
          headers: JSON.parse(JSON.stringify(headers))
        });
      })
  }

  onExplorerResize = e => {
    const { explorerClientX, explorerWidth } = this.state;
    if (explorerClientX === null) {
      this.setState({ explorerClientX: e.clientX });
    } else {
      const newExplorerWidth = explorerWidth + e.clientX - explorerClientX;
      setExplorerWidthInLocalStorage(newExplorerWidth);
      this.setState({
        explorerWidth: newExplorerWidth,
        explorerClientX: e.clientX,
      });
    }
  };

  editQuery = query => {
    this.setState({ query });
  };

  toggleExplorer = () => {
    this.setState(state => ({
      explorerOpen: !state.explorerOpen,
    }));
  };

  handleExplorerResize = e => {
    e.preventDefault();
    document.addEventListener('mousemove', this.onExplorerResize);
    this.setState({
      isResizing: true,
    });
  };

  handleExplorerResizeStop = e => {
    e.preventDefault();
    document.removeEventListener('mousemove', this.onExplorerResize);
    this.setState({
      isResizing: false,
    });
  };

  render() {
    const {
      schema,
      explorerOpen,
      query,
      explorerWidth,
      isResizing,
    } = this.state;
    const { renderGraphiql } = this.props;
    return (
      <div
        className={`graphiql-container ${
          isResizing ? 'explorerCursorResize' : ''
        }`}
        onMouseUp={this.handleExplorerResizeStop}
      >
        <div className="gqlexplorer">
          {explorerOpen && (
            <div
              className="explorerGraphiqlSeparator explorerCursorResize"
              onMouseDown={this.handleExplorerResize}
              onMouseUp={this.handleExplorerResizeStop}
            />
          )}
          <GraphiQLExplorer
            schema={schema}
            query={query}
            onEdit={this.editQuery}
            explorerIsOpen={explorerOpen}
            onToggleExplorer={this.toggleExplorer}
            getDefaultScalarArgValue={getDefaultScalarArgValue}
            makeDefaultArg={makeDefaultArg}
            width={explorerWidth}
          />
        </div>
        {renderGraphiql({
          query,
          schema,
          onEditQuery: this.editQuery,
          toggleExplorer: this.toggleExplorer,
        })}
      </div>
    );
  }
}

export default OneGraphExplorer;
