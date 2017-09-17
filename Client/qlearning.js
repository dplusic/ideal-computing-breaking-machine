var RESOLUTION = 16;
var NUM_JOINT = 7;
var ANGLE_MIN = 0.0;
var ANGLE_MAX = 1.0;

var states = {};
var actions = [' ', 'Q', 'W', 'O', 'P', 'QO', 'QP', 'WO', 'WP'];
var q_table = {};

var alpha = 0.2;
var gamma = 0.8;
var epsilon = 0.1;


function encodeState(angles) {
    var state = 0;
    for (i = 0; i < angles.length; i++) {
        a = angles[i];
        var cur = Math.min(RESOLUTION - 1, Math.floor(((a - ANGLE_MIN) * RESOLUTION / ANGLE_MAX)));
        state = (RESOLUTION * state) + cur;
    }
    return state
}

function addState(state) {
    if (state in states)
        return state;

    // initialize Q-Value
    states[state] = {}
    for (var i in actions) {
        states[state][actions[i]] = 0.0;
    }
}

function getQValue(state, action) {
    if (state in q_table) return q_table[state][action];
    addState(state);
    return q_table[state][action];
}


function getOptimalAction(angle) {
    var best_q = -99999999.0;
    var best_action = null;
    state = encodeState(angle);
    for (var i in actions) {
        var action = actions[i];
        q = getQValue(state, action);
        if (q > best_q) {
            best_q = q;
            best_action = action;
        }
    }
    return best_action;
}

function getAction(angle) {
    var rand = Math.random();
    if (rand < epsilon) {
        var selected = Math.floor(Math.random() * actions.length);
        return actions[selected];
    }
    return getOptimalAction(angle);
}

function updateQValue(state, action, q_value) {
    if (state in q_table) q_table[state][action] = q_value;
    addState(state);
    q_table[state][action] = q_value;
}

function updateReward(angle, action, next_angle, move_dist) {
    state = encodeState(angle);
    next_state = encodeState(next_angle);
    var opt_next_q_value = 0;
    for (var i in actions) {
        opt_next_q_value = Math.max(opt_next_q_value, getQValue(next_state, actions[i]));
    }
    var next_q_value = getQValue(state, action) + alpha * (move_dist + gamma * opt_next_q_value - q_value);
    updateQValue(state, action, next_q_value);
}

// TODO
function getNextAngles(angles, action) {
    next_angles = [];
    return next_angles;
}

// TODO
function feedback(state, action, nextState, reward) {
}

console.log(Math.random());
console.log(Math.min(10, 20));
