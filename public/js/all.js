var sock = null;
var stream = function(callback) {
  var connect = function() {
    if (sock) {
      return;
    }

    sock = new SockJS('/timeline');

    sock.onopen = function() {
      // connected
    };

    sock.onmessage = function(e) {
      var data = JSON.parse(e.data);
      callback(data);
    };

    sock.onclose = function() {
      sock = null;
    };
  };

  connect();
  setInterval(connect, 2000);
};

/** @jsx React.DOM */

var Message = React.createClass({displayName: 'Message',
  render: function() {
    return (
      React.DOM.div({className: "message tweet"}, 
        React.DOM.div({className: "header"}, 
          React.DOM.img({className: "icon", src: this.props.data.payload.user.profile_image_url_https}), 
          React.DOM.span({className: "name"}, this.props.data.payload.user.name), 
          React.DOM.span({className: "screen-name"}, "@", this.props.data.payload.user.screen_name)
        ), 
        React.DOM.div({className: "text"}, this.props.data.text)
      )
    );
  }
});

var Messages = React.createClass({displayName: 'Messages',
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
        Message({data: message, key: message.id})
      );
    });

    return (
      React.DOM.div(null, messageNodes)
    );
  }
});

React.renderComponent(
  Messages(null),
  document.getElementById('messages')
);
