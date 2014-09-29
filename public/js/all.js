var sock = null;
var stream = function(query, callback) {
  var connect = function() {
    if (sock) {
      return;
    }

    sock = new SockJS('/timeline');

    sock.onopen = function() {
      var json = JSON.stringify({
        query: query
      });
      sock.send(json);
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

var Tweet = React.createClass({displayName: 'Tweet',
  render: function() {
    return (
      React.DOM.div({className: "message tweet"}, 
        React.DOM.div({className: "header"}, 
          React.DOM.img({className: "icon", src: this.props.data.payload.user.profile_image_url_https}), 
          React.DOM.span({className: "name"}, this.props.data.payload.user.name), 
          React.DOM.span({className: "screen-name"}, "@", this.props.data.payload.user.screen_name), 
          React.DOM.i({className: "fa fa-twitter twitter-icon"})
        ), 
        React.DOM.div({className: "text"}, _.unescape(this.props.data.text))
      )
    );
  }
});

var IrcMessage = React.createClass({displayName: 'IrcMessage',
  render: function() {
    return (
      React.DOM.div({className: "message irc"}, 
        React.DOM.div({className: "header"}, 
          React.DOM.span({className: "name"}, this.props.data.payload.from)
        ), 
        React.DOM.div({className: "text"}, _.unescape(this.props.data.text))
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
            Tweet({data: message, key: message.id})
          );
        case "irc":
          return (
            IrcMessage({data: message, key: message.id})
          );
      }
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
