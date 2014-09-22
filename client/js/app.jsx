/** @jsx React.DOM */

var Message = React.createClass({
  render: function() {
    return (
      <div className="message">
        <img src={this.props.data.payload.user.profile_image_url_https}></img>
        <div className="header">
          <strong>{this.props.data.payload.user.name}</strong>
          <span>@{this.props.data.payload.user.screen_name}</span>
        </div>
        <div>{this.props.data.text}</div>
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
