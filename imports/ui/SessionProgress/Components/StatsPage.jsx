import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import { Chart } from 'react-google-charts';
import { Random } from 'meteor/random';
import Loading from '../../Components/Loading/Loading';
import Teams from '../../../api/teams';
import Responses from '../../../api/responses';
import Users from '../../../api/users';
import Sessions from '../../../api/sessions';
import Quizzes from '../../../api/quizzes';
import TextBox from '../../Components/TextBox/TextBox';
import ActivityEnums from '../../../enums/activities';

import './StatsPage.scss';
import responses from '../../../api/responses';

export default class StatsPage extends Component {
  static propTypes = {
    index: PropTypes.number.isRequired,
    quiz: PropTypes.object.isRequired,
    session_id: PropTypes.string.isRequired,
    activity_id: PropTypes.string.isRequired,
    end: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const session = Sessions.findOne(this.props.session_id);

    this.state = {
      round: session.round
    };
  }

  // finds and returns the user in the session with the most points so far (2T1L)
  getTopUserPoints() {
    const { activity_id } = this.props;
    // get all teams in this activity
    const teams = Teams.find({ activity_id }).fetch();
    let topUser = '';
    let topPoints = 0;

    // check each teams members
    teams.map(team => {
      team.members.map(n => {
        const curr_user = Users.findOne({ pid: n.pid });

        // for each memory, find their points for this session, and see if is the greatest
        curr_user.points_history.map(curr_user_point => {
          if (curr_user_point.session === this.props.session_id) {
            if (curr_user_point.points > topPoints) {
              topUser = curr_user.name;
              topPoints = curr_user_point.points;
            }
          }
        });
      });
    });

    if (topUser === '') return 'No top user right now...';
    else return topUser + ', with ' + topPoints + ' points';
  }

  getBestLies() {
    const { activity_id } = this.props;

    // get responses, sort by num_voted
    const responses = Responses.find({ activity_id }, { sort: { num_voted: -1 } }).fetch();

    if (!responses) return 'No good lies...';

    if (!responses[0]) return 'No good lies...';

    if (responses[0].quiz_id) return 'TODO: this is a quiz!';

    const lies = responses.map(re => re.options[2]).filter(opt => opt.count === 0);

    if (!lies) return 'No good lies...';

    if (!lies[0]) return 'No good lies...';

    return lies[0].text;
  }

  getUniqueTruths() {
    const { activity_id } = this.props;

    // get responses
    const responses = Responses.find({ activity_id }).fetch();

    if (!responses) return 'No unique truths...';

    if (!responses[0]) return 'No unique truths...';

    if (responses[0].quiz_id) return 'TODO: this is a quiz!';

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
    Users.findOne({ pid });
  }

  getFastestTeams() {
    const { activity_id } = this.props;

    // get top 3 fastest teams
    const teams = Teams.find(
      { activity_id, teamFormationTime: { $gt: 0 } },
      {
        sort: { teamFormationTime: 1 },
        limit: 1
      }
    ).fetch();

    if (teams == false) return 'No data';

    return teams.map(team => {
      return (
        <div key={team._id}>
          {team.members.map(n => Users.findOne({ pid: n.pid }).name).join(', ')}:
          {' ' + parseInt(team.teamFormationTime / 1000)}s
        </div>
      );
    });
  }

  // upon exiting this page, update the round we are on
  componentWillUnmount() {
    Sessions.update(this.props.session_id, {
      $set: {
        round: this.state.round + 1
      }
    });
  }

  getLetter(index) {
    switch (index) {
      case 0:
        return 'A';
      case 1:
        return 'B';
      case 2:
        return 'C';
      case 3:
        return 'D';
      default:
        return '';
    }
  }

  getData(quiz) {
    const data = [['Option', 'Individual Votes', 'Team Votes']];

    // const fakeData = [['A', 32, 45], ['B', 23, 12], ['C', 15, 17], ['D', 8, 6]];

    // fakeData.map(opt => data.push(opt));

    quiz.questions.map((question, index) => {
      //if (index === this.props.index) {
      if (question.type === ActivityEnums.quiz.MULTI_CHOICE) {
        question.options.map((opt, i) => {
          if (opt.correct) data.push([this.getLetter(i), opt.countIndv, opt.countIndvTeam]);
          else data.push([this.getLetter(i), opt.countIndv, opt.countTeam]);
        });
      }
      //}
    });

    // console.log(data);

    return data;
  }

  getDataIndex(index) {
    const data = [['Option', 'Individual Votes', 'Team Votes']];

    const question = this.props.quiz.questions[index];

    if (question.type === ActivityEnums.quiz.MULTI_CHOICE) {
      question.options.map((opt, i) => {
        if (opt.correct) data.push([this.getLetter(i), opt.countIndv, opt.countIndvTeam]);
        else data.push([this.getLetter(i), opt.countIndv, opt.countTeam]);
      });
    }

    return data;
  }

  render() {
    const { activity_id } = this.props;

    if (!activity_id) return <Loading />;

    const { quiz } = this.props;

    if (!quiz) {
      return (
        <div>
          No Quiz for this activity. Make some stats for the next one!
          <Loading />
        </div>
      );
    }


    const getAnswer = q => {
      if (q.type === ActivityEnums.quiz.MULTI_CHOICE) {
        const optNum = q.options.indexOf(q.options.filter(opt => opt.correct)[0]);
        return this.getLetter(optNum) + ". " + q.options.filter(opt => opt.correct)[0].text;
      } else {
        return q.answer;
      }
    };

    return (
      <div className="stats-page">
        {/* <h1>Round {this.state.round}: Quiz</h1> */}
        <h1 className="stats-title">Quiz Answers</h1>
        {/* <h2 id="bold-font">Question 1</h2> */}
        {/* {{ data } && currentType === ActivityEnums.quiz.MULTI_CHOICE && (
          <Chart
            chartType="ColumnChart"
            data={data}
            options={{
              colors: ['#1E91D6', '#F05D5E'],
              chartArea: { width: '60%' },
              vAxis: {
                title: 'Number of votes',
                minValue: 0
              },
              hAxis: {
                title: 'Option'
              }
            }}
            width="100%"
            height="50%"
            legendToggle
          />
        )} */}
        <div className="responses-grid">
          {quiz.questions.map((q, index) => (
            <>
              <div className="needshr" key={Random.id()}>
                <h2>{`Question ${index + 1}: ${q.prompt}`}</h2>
                <div id="box-answer">
                  <strong> Correct answer: </strong>
                  {getAnswer(q)}
                </div>
              </div>
              {q.type === ActivityEnums.quiz.MULTI_CHOICE && (
                <div key={Random.id()} className="stats-graph needshr">
                  <Chart
                    chartType="ColumnChart"
                    data={this.getDataIndex(index)}
                    options={{
                      colors: ['#1E91D6', '#F05D5E'],
                      chartArea: { width: '60%' },
                      vAxis: {
                        title: 'Number of votes',
                        minValue: 0
                      },
                      hAxis: {
                        title: 'Option'
                      }
                    }}
                    width="100%"
                    height="100%"
                    legendToggle
                  />
                </div>
              )}
              {q.type !== ActivityEnums.quiz.MULTI_CHOICE && (
                <div className="st-answers needshr">
                  {Responses.find({ activity_id: this.props.activity_id, type: 'indv' }, { limit: 3 })
                    .fetch()
                    .map((res, j) => {
                      return (
                        <div>
                          {j === 0 && <TextBox label="Student responses">{res.selected[index].text}</TextBox>}
                          {j > 0 && <TextBox>{res.selected[index].text}</TextBox>}
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          ))}
        </div>
        {/* <h2>Question 2</h2>
        {{ data } && currentType === ActivityEnums.quiz.MULTI_CHOICE && (
          <Chart
            chartType="ColumnChart"
            data={data}
            options={{
              colors: ['#1E91D6', '#F05D5E'],
              chartArea: { width: '60%' },
              vAxis: {
                title: 'Number of votes',
                minValue: 0
              },
              hAxis: {
                title: 'Option'
              }
            }}
            width="100%"
            height="50%"
            legendToggle
          />
        )} */}
        {/* <div>
          {this.props.quiz.questions.map(
            (q, index) =>
              index === this.props.index && (
                <h2 key={Random.id()}>
                  <div>{q.prompt}</div>
                  <div id="font-size">{getAnswer(q)}</div>
                </h2>
              )
          )}
        </div> */}
        {/* <h2>Question 3</h2>
        <div>
          {this.props.quiz.questions.map(
            (q, index) =>
              index === this.props.index && (
                <h2 key={Random.id()}>
                  <div>{q.prompt}</div>
                  <div id="font-size">{getAnswer(q)}</div>
                </h2>
              )
          )}
        </div> */}
        {/* <h2>Question 4</h2>
        <div>
          {this.props.quiz.questions.map(
            (q, index) =>
              index === this.props.index && (
                <h2 key={Random.id()}>
                  <div>{q.prompt}</div>
                  <div id="font-size">{getAnswer(q)}</div>
                </h2>
              )
          )}
        </div> */}
        {/* <TextBox label="Fastest Team:">{this.getFastestTeams()}</TextBox> */}
        <button className="bigscreen-button smaller" onClick={() => this.props.end()}>
          End Activity
        </button>
      </div>
    );
  }
}
