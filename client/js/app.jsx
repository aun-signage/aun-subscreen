/** @jsx React.DOM */

var Tweet = React.createClass({
  render: function() {
    return (
      <div className="message tweet">
        <div className="header">
          <img className="icon" src={this.props.data.payload.user.profile_image_url_https}></img>
          <span className="name">{this.props.data.payload.user.name}</span>
          <span className="screen-name">@{this.props.data.payload.user.screen_name}</span>
          <i className="fa fa-twitter twitter-icon"></i>
        </div>
        <div className="text">{_.unescape(this.props.data.text)}</div>
      </div>
    );
  }
});

var IrcMessage = React.createClass({
  render: function() {
    return (
      <div className="message irc">
        <div className="header">
          <span className="name">{this.props.data.payload.from}</span>
        </div>
        <div className="text">{_.unescape(this.props.data.text)}</div>
      </div>
    );
  }
});

var Messages = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    var self = this;
    var query = location.search.replace(/^\?/, '')
    stream(query, function(data) {
      self.setState({data: data});
    });
  },
  render: function() {
    var messageNodes = this.state.data.map(function (message) {
      switch (message.type) {
        case "tweet":
          return (
            <Tweet data={message} key={message.id}/>
          );
        case "irc":
          return (
            <IrcMessage data={message} key={message.id}/>
          );
      }
    });

    return (
      <div>{messageNodes}</div>
    );
  }
});

React.renderComponent(
  <Messages/>,
  document.getElementById('messages')
);