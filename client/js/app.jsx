/** @jsx React.DOM */

var Message = React.createClass({
  render: function() {
    return (
      <div className="message tweet">
        <div className="header">
          <img className="icon" src={this.props.data.payload.user.profile_image_url_https}></img>
          <span className="name">{this.props.data.payload.user.name}</span>
          <span className="screen_name">@{this.props.data.payload.user.screen_name}</span>
        </div>
        <div className="text">{this.props.data.text}</div>
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
    stream(function(data) {
      self.setState({data: data});
    });
  },
  render: function() {
    var messageNodes = this.state.data.map(function (message) {
      return (
        <Message data={message} key={message.id}/>
      );
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
