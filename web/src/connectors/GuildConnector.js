import {connect} from 'react-redux';
import {getGuild} from '../reducers/guild';
import Guild from '../components/Guild';

export default connect(getGuild)(Guild);
