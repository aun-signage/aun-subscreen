/** @jsx React.DOM */

var sock = null;

var stream = function(callback) {
  var connect = function() {
    if (sock) {
      return;
    }

    sock = new SockJS('/timeline');

    sock.onopen = function() {
      console.log('open');
    };

    sock.onmessage = function(e) {
      var data = JSON.parse(e.data);
      console.log('message', data);
      callback(data);
    };

    sock.onclose = function() {
      console.log('close');
      sock = null;
    };
  };

  connect();
  setInterval(connect, 2000);
};

var Message = React.createClass({displayName: 'Message',
  render: function() {
    return (
      React.DOM.div({className: "message"}, 
        React.DOM.img({src: this.props.data.payload.user.profile_image_url_https}), 
        React.DOM.div({className: "header"}, 
          React.DOM.strong(null, this.props.data.payload.user.name), 
          React.DOM.span(null, "@", this.props.data.payload.user.screen_name)
        ), 
        React.DOM.div(null, this.props.data.text)
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
  Messages({data: messages}),
  document.getElementById('messages')
);
