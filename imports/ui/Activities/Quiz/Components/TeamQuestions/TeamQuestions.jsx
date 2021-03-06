import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Random } from 'meteor/random';

import InputButtons from '../../../Components/InputButtons/InputButtons';
import ActivityEnums from '../../../../../enums/activities';
import TextInput from '../../../../Components/TextInput/TextInput';
import Tags from '../../../../Components/Tags/Tags';
import './TeamQuestions.scss';
import Responses from '../../../../../api/responses';
import Users from '../../../../../api/users';

export default class TeamQuestions extends Component {
  static propTypes = {
    quiz: PropTypes.object,
    pid: PropTypes.string,
    questions: PropTypes.array,
    responses: PropTypes.array,
    index: PropTypes.number
  };

  static defaultProps = {
    questions: [],
    responses: [],
    index: 0
  };

  state = {
    responses: this.props.responses || this.props.questions.map(() => ''),
    teammates: this.props.team.members.map(m => m.pid)
  };

  handleMC = selected => {
    // this.props.done(selected);
    const { responses } = this.state;
    const { index, questions, done, next } = this.props;

    // update response
    responses[index] = selected;

    // next or done
    if (questions.length === index + 1) done(responses);
    else next();
  };

  handleFR = selected => {
    // this.props.done(selected);
    const { responses } = this.state;
    const { index, questions, done, next } = this.props;

    // update response
    responses[index] = { text: this.getOption(selected), id: selected };

    // next or done
    if (questions.length === index + 1) done(responses);
    else next();
  };

  getNameFromPid(pid) {
    return Users.findOne({ pid }).name;
  }

  getOption(optionId) {
    const { teammates } = this.state;
    const { quiz, index } = this.props;

    // get pid
    const responses = teammates
      .map(pid => Responses.findOne({ pid, quiz_id: quiz._id }))
      .filter(res => res != null)
      .filter(res => res.selected[index].text !== '')
      .map(res => ({
        id: res.selected[index].id,
        badge: this.getNameFromPid(res.pid),
        text: res.selected[index].text
      }));

    const option = responses.filter(r => r.id === optionId)[0].text;

    return option;
  }

  // get the text from a quiz option
  getTextFromOpt(id, options) {
    return options.filter(opt => opt.id === id)[0].text;
  }

  // get the options for team FR with badges
  getFROptions() {
    const { teammates } = this.state;
    const { quiz, index } = this.props;

    // get the responses from the indiv round
    const responses = teammates
      .map(pid => Responses.findOne({ pid, quiz_id: quiz._id }))
      .filter(res => res != null)
      .filter(res => res.selected[index].text !== '')
      .map(res => ({
        id: res.selected[index].id,
        badge: this.getNameFromPid(res.pid),
        text: res.selected[index].text
      }));

    return responses;
  }

  // get the options for team MC with badges
  getMCOptions() {
    const { teammates } = this.state;
    const { quiz, questions, index } = this.props;

    // get the responses from the indiv round
    const responses = teammates
      .map(pid => Responses.findOne({ pid, quiz_id: quiz._id }))
      .filter(res => res != null)
      .filter(res => res.selected[index].text !== '')
      .map(res => ({
        id: res.selected[index],
        badge: this.getNameFromPid(res.pid),
        text: this.getTextFromOpt(res.selected[index], questions[index].options)
      }));

    // build the options with the badges attached
    const options = questions[index].options.map(opt => ({
      id: opt.id,
      badge: responses
        .filter(response => response.id === opt.id)
        .map(teammate => teammate.badge)
        .join(', '),
      text: opt.text
    }));

    // console.log(options);

    return options;
  }

  render() {
    const { index, questions } = this.props;
    const { responses } = this.state;

    if (!questions) return 'No questions!';

    let question = null;

    try {
      question = questions[index];
    } catch (error) {
      return JSON.stringify(error);
    }

    const selected = responses[index];
    const { teammates } = this.state;

    if (question.type === ActivityEnums.quiz.MULTI_CHOICE) {
      return (
        <InputButtons
          prompt={question.prompt}
          handleSelection={this.handleMC}
          list
          selected={selected}
          options={this.getMCOptions()}
        />
      );
    }

    return (
      <InputButtons
        prompt={question.prompt}
        handleSelection={this.handleFR}
        list
        selected={selected.id}
        options={this.getFROptions()}
      />
    );
  }
}
