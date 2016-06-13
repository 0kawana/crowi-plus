import React from 'react';

// Header.SearchForm
export default class SearchForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      keyword: '',
      searchedKeyword: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.ticker = null;
  }

  componentDidMount() {
    this.ticker = setInterval(this.searchFieldTicker.bind(this), this.props.pollInterval);
  }

  componentWillUnmount() {
    clearInterval(this.ticker);
  }

  search() {
    if (this.state.searchedKeyword != this.state.keyword) {
      this.props.onSearchFormChanged({keyword: this.state.keyword});
      this.setState({searchedKeyword: this.state.keyword});
    }
  }

  searchFieldTicker() {
    this.search();
  }

  handleSubmit(event) {
    event.preventDefault();
    this.search();
  }

  handleChange(event) {
    const keyword = event.target.value;
    this.setState({keyword});
  }

  render() {
    return (
      <form
        action="/_search"
        className="search-form form-group input-group search-top-input-group"
        onSubmit={this.handleSubmit}
      >
        <input
          autocomplete="off"
          type="text"
          className="search-top-input form-control"
          placeholder="Search ..."
          name="q"
          value={this.state.keyword}
          onChange={this.handleChange}
        />
        <span className="input-group-btn">
          <button type="submit" className="btn btn-default">
            <i className="search-top-icon fa fa-search"></i>
          </button>
        </span>
      </form>
    );
  }
}

SearchForm.propTypes = {
  onSearchFormChanged: React.PropTypes.func.isRequired,
  pollInterval: React.PropTypes.number,
};
SearchForm.defaultProps = {
  pollInterval: 1000,
};
