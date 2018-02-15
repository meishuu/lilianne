import {connect} from 'react-redux';
import {getError} from '../reducers/error';
import ErrorScreen from '../components/ErrorScreen';

export default connect(getError)(ErrorScreen);
