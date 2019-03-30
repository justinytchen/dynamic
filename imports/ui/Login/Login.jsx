import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withTracker } from 'meteor/react-meteor-data';
import Users from '../../api/users'
import Wrapper from '../Wrapper/Wrapper'
import '../assets/_main.scss';
import Sessions from '../../api/sessions';
import Color from '../Color';
import Activity from '../Activity/Activity';

import './Login.scss';

class Login extends Component {
  // static propTypes = {
  //   prop: PropTypes
  // }

  constructor(props) {
    super(props);
    this.state = {
      pid: '',
      ready: false,
      invalid: false,
      localUser: localStorage.getItem('pid')
    };
  }

  // update the pid as the user types
  handleChange(evt) {
    this.setState({
      pid: evt.target.value
    });
  }

  getUserFromLocalStorage() {
    if (this.state.saved) {

    }
  }

  // TODO: use localStorage to suggest login
  login(evt) {
    evt.preventDefault();

    const { pid } = this.state;

    if (pid.length === 0) return;

    // find user by pid on database
    const user = Users.findOne({pid});

    // user exists!
    if (user) {

      // user is already a participant in this session!
      // TODO: something went wrong.. i.e., refreshed
      if (this.props.session.participants.includes(pid)) {
        this.setState({
          ready: true
        });
        return;
      }

      // add user to session
      Sessions.update(this.props.session._id, {
        $push: {
          participants: pid
        }
      }, () => {
        this.setState({
          ready: true
        });
      });

    } else {
      this.setState({
        invalid: true
      });
    }    
  }

  // will alert the user that there pid is not valid
  renderUsernameTaken = () => {
    if (this.state.invalid) {
      return <p style={{color:"red"}}>That PID is invalid!</p>
    }
  }

  render() {

    // session not available yet TODO: return loading component
    if (!this.props.session) return "Loading...";

    const { code } = this.props.session;
    const { ready } = this.state;

    const pid = this.state.pid;// || localStorage.getItem("pid");

    // user entered their name!
    // at this point, user is logged in!
    if (ready) {

      // get session_id
      const { _id } = this.props.session;

      return <Activity pid={pid} session_id={_id} />
    }

    return (
      <Wrapper>
        <h3 id="navbar">Dynamic</h3>
        <h2 id="session">Session: </h2>
        <h2 id="u-container">{code}</h2>
        <form id="pid-form" onSubmit={(evt) => this.login(evt)}>
          <div id="pid" className="field-container">
            {this.renderUsernameTaken()}
            <label className="field-title" htmlFor="pid" id="pid">Student PID:</label>
            <div className="input-container">
              <input className="u-container" type="text" name="pid" placeholder="i.e., A12345678" id="pid" value={this.state.pid} onChange={(evt) => this.handleChange(evt)}/>
            </div>
            <input id="next_button" type="submit" value="Continue"/>
          </div>
        </form>
      </Wrapper>
    )
  }
}

export default withTracker((props) => {
  const session = Sessions.findOne({code: props.match.params.code});
  return { session }
})(Login);