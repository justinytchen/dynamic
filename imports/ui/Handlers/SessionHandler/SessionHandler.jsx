import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';

import ActivityHandler from '../ActivityHandler/ActivityHandler';

import Sessions from '../../../api/sessions';
import Activities from '../../../api/activities';

import ActivityEnums from '../../../enums/activities';
import SessionEnums from '../../../enums/sessions';

import Loading from '../../Components/Loading/Loading';
import Survey from '../../Components/Survey/Survey';
import OnboardingInstructions from '../../Activities/Components/OnboardingInstructions/OnboardingInstructions';
import { UserContext } from '../../Contexts/UserContext';

class SessionHandler extends Component {
  static propTypes = {
    location: PropTypes.shape({
      state: PropTypes.shape({
        pid: PropTypes.string
      })
    }),
    match: PropTypes.shape({
      params: PropTypes.shape({
        code: PropTypes.string.isRequired
      }).isRequired
    }).isRequired,
    activity: PropTypes.object,
    status: PropTypes.number,
    length: PropTypes.number
  };

  static defaultProps = {
    location: {
      state: {
        pid: null
      }
    }
  };

  constructor(props) {
    super(props);
  }

  // called before render
  shouldComponentUpdate(nextProps) {

    const { status } = this.props;

    // don't re-render OnboardingInstructions just because someone joins
    if (status === SessionEnums.status.READY && nextProps.status === status) {
      return false;
    }

    return true;
  }

  render() {
    // check if user logged in
    const { pid } = this.props;

    if (!pid) return 'Please log in first!';

    // extract session props
    const { status, length, activities, instructor } = this.props;

    // extract activity props
    const { activity } = this.props;

    // end of activity, link to survey
    if (status === SessionEnums.status.FINISHED) return <Survey />;

    // before the activities begin
    if (status === SessionEnums.status.READY) return <OnboardingInstructions />;

    if (!activity) {
      return <Loading />;
    }

    const progress = activities.indexOf(activity._id) + 1;

    if (status === SessionEnums.status.ACTIVE)
      return <ActivityHandler pid={pid} sessionLength={length} progress={progress} activity_id={activity._id} instructor={instructor} />;

    return <Loading />;
  }
}

SessionHandler.contextType = UserContext;

export default withTracker(props => {
  // get session code from URL
  const { code } = props.match.params;

  // user not logged in
  if (!props.location.state) return {};

  const { pid } = props.location.state;

  // get session object from URL
  const session = Sessions.findOne({ code });

  if (!session) return { pid };

  // get session status and progress
  const { instructor, status, activities } = session
  const length = activities.length;

  // get current activity in session
  const activity = Activities.findOne(
    {
      session_id: session._id,
      status: {
        $in: [
          ActivityEnums.status.BUILDING_TEAMS,
          ActivityEnums.status.TEAM_FORMATION,
          ActivityEnums.status.INPUT_TEAM,
          ActivityEnums.status.ASSESSMENT
        ]
      }
    },
    { sort: { status: 1 } }
  );

  return { pid, status, length, activity, activities, instructor };
})(SessionHandler);
