import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Teams from '../../../api/teams';
import Responses from '../../../api/responses';
import Users from '../../../api/users';

export default class StatsPage extends Component {

  getTopUserPoints() {
    const { activity_id } = this.props;
    const teams = Teams.find({activity_id}).fetch();
    var topUser = "";
    var topPoints = 0;
    teams.map(team => {
      team.members.map(n => {
        var curr_user = Users.findOne({pid: n.pid});
        if (curr_user.points > topPoints) {
          topUser = curr_user.name;
          topPoints = curr_user.points;
        }
      });
    });
    if (topUser === "") return "No top user right now...";
    else return topUser + ", with " + topPoints + " points";
  }

  getBestLies() {
    const { activity_id } = this.props;

    // get responses, sort by num_voted
    const responses = Responses.find({activity_id}, {sort: {num_voted: -1}}).fetch();
    if (!responses) return 'No good lies...';

    const lies = responses.map(re => re.options[2]).filter(opt => opt.count === 0);

    if (!lies) return 'No good lies...';
    if (!lies[0]) return 'No good lies...';
    return lies[0].text;
  }

  getUniqueTruths() {
    const { activity_id } = this.props;

    // get responses
    const responses = Responses.find({activity_id}).fetch();
    if (!responses) return 'No unique truths...';

    // get all truths
    const truths0 = responses.map(re => re.options[0]).filter(opt => opt.count > 0);
    const truths1 = responses.map(re => re.options[1]).filter(opt => opt.count > 0);
    const truths = truths0.concat(truths1).sort((a, b) => b.count - a.count);

    if (!truths) return 'No unique truths...';
    if (!truths[0]) return 'No unique truths...';
    return truths[0].text;
  }

  // give top users points
  addPoints(pid) {
    Users.findOne({pid});
  };

  getFastestTeams() {
    const { activity_id } = this.props;

    // get top 3 fastest teams
    const teams = Teams.find({activity_id}, {
      sort: { teamFormationTime: 1 },
      limit: 3
    }).fetch();

    return teams.map(team => {
      return <div key={team._id}>{team.members.map(n => Users.findOne({pid: n.pid}).name).join(', ')}:
      {' ' + parseInt(team.teamFormationTime / 1000)}s</div>
    });
  }

  render() {
    return (
      <div>
        <h1>2 Truths and 1 Lie</h1>
          <br></br>
          <h2>Top Guesser:</h2>
          <div className="text-box-bigscreen-shrink">
            <h2>{this.getTopUserPoints()}</h2>
          </div>
          <h2>Best Lies:</h2>
          <div className="text-box-bigscreen-shrink">
            <h2>{this.getBestLies()}</h2>
          </div>
          <h2>Most Unique Truths:</h2>
          <div className="text-box-bigscreen-shrink">
            <h2>{this.getUniqueTruths()}</h2>
          </div>
          <h2>Fastest Teams:</h2>
          <div className="text-box-bigscreen-shrink">
            <h2> {this.getFastestTeams()}</h2>
          </div><br></br>
          
      </div>
    )
  }
}
