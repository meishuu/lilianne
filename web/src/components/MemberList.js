import React from 'react';
import {connect} from 'react-redux';
import {getMemberList} from '../reducers/members';
import Member from './Member';

function MemberList({members}) {
  return (
    <div className="scroller-wrap">
      <div className="channel-members scroller">
        <h2>DJ Order</h2>
        {members.map(member => <Member key={member.id} {...member} />)}
      </div>
    </div>
  );
}

export default connect(getMemberList)(MemberList);
