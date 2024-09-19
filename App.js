import React, {useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Alert,
    Modal,
    Pressable
} from 'react-native';

class ChessHoleComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View
                ref={view => {
                    this.myComponent = view;
                }}
                style={[this.props.style]}
            >
            </View>
        );
    }
}

let chess_list = [];
let chess_holes = [];
let column_range = [];
let player_type = 0; /// 0 for Player1, 1 for Player2, 2 for no player
let win_chess = [];
let winner = 2; /// 0 for Player1 wins, 1 for Player2 wins, 2 for no winner

function init_data() {
    chess_holes.length = 0;
    chess_list.length = 0;
    player_type = 0;
    winner = 2;
    column_range.length = 0;
    win_chess.length = 0;

    console.log("init data");
}

function is_horizontal_win(row, col, ptype, rows, cols) {
    let min_col = Math.max(col - 3, 0);
    let max_col = Math.min(col + 3, cols - 1);
    for (let i = min_col; i <= max_col - 3; ++i) {
        if (chess_holes[row * cols + i].player_type == ptype &&
            chess_holes[row * cols + i + 1].player_type == ptype &&
            chess_holes[row * cols + i + 2].player_type == ptype &&
            chess_holes[row * cols + i + 3].player_type == ptype) {
            return [{row: row, col: i}, {row: row, col: i + 1}, {row: row, col: i + 2}, {row: row, col: i + 3}];
        }
    }
    return null;
}

function is_vertical_win(row, col, ptype, rows, cols) {
    let min_row = Math.max(row - 3, 0);
    let max_row = Math.min(row + 3, rows - 1);
    for (let i = min_row; i <= max_row - 3; ++i) {
        let i0 = i * cols + col;
        let i1 = (i + 1) * cols + col;
        let i2 = (i + 2) * cols + col;
        let i3 = (i + 3) * cols + col;
        if (chess_holes[i0].player_type == ptype &&
            chess_holes[i1].player_type == ptype &&
            chess_holes[i2].player_type == ptype &&
            chess_holes[i3].player_type == ptype) {
            return [{row: i, col: col}, {row: i + 1, col: col}, {row: i + 2, col: col}, {row: i + 3, col: col}];
        }
    }
    return null;
}

function is_45degree_win(row, col, ptype, rows, cols) {
    let cnt_in_a_row = 0;
    let win_grids = [];
    for (let r = row - 3, c = col + 3; (r <= row + 3) && (c >= col - 3); r++, c--) {
        if (r < 0 || c < 0) {
            cnt_in_a_row = 0;
            win_grids.length = 0;
        } else if (r >= rows || c >= cols) {
            cnt_in_a_row = 0;
            win_grids.length = 0;
        } else if (chess_holes[r * cols + c].player_type != ptype) {
            cnt_in_a_row = 0;
            win_grids.length = 0;
        } else {
            win_grids.push({row: r, col: c});
            cnt_in_a_row++;
        }
        if (cnt_in_a_row >= 4) {
            return win_grids;
        }
    }
    return null;
}

function is_minus45degree_win(row, col, ptype, rows, cols) {
    let cnt_in_a_row = 0;
    let win_grids = [];
    for (let r = row - 3, c = col - 3; (r <= row + 3) && (c <= col + 3); r++, c++) {
        if (r < 0 || c < 0) {
            cnt_in_a_row = 0;
            win_grids.length = 0;
        } else if (r >= rows || c >= cols) {
            cnt_in_a_row = 0;
            win_grids.length = 0;
        } else if (chess_holes[r * cols + c].player_type != ptype) {
            cnt_in_a_row = 0;
            win_grids.length = 0;
        } else {
            win_grids.push({row: r, col: c});
            cnt_in_a_row++;
        }
        if (cnt_in_a_row >= 4) {
            return win_grids;
        }
    }
    return null;
}

class BoardComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const window = Dimensions.get('window');
        const board_height = window.height - 120;
        const board_width = window.width * 0.8;
        const board_top = 100;
        const board_left = window.width * 0.1;

        const board_hole_gap = 20;
        let rows = 8;
        let cols = 8;
        const chess_size = 40;
        const radius = chess_size / 2;
        cols = Math.floor(board_width / (chess_size + board_hole_gap));
        rows = Math.floor(board_height / (chess_size + board_hole_gap));
        console.log("rows, cols:", rows, cols);
        const margin_lr = Math.floor((board_width - (chess_size * cols + board_hole_gap * (cols - 1))) / 2);
        const margin_tb = Math.floor((board_height - (chess_size * rows + board_hole_gap * (rows - 1))) / 2);

        this.state = {
            chess_size: chess_size,
            chess_hole_gap: board_hole_gap,
            rows: rows,
            cols: cols,
            borderRadius: radius,
            orig_x: board_left,
            orig_y: board_top,
            margin_lr: margin_lr,
            margin_tb: margin_tb,
        };

        function calcChessHole(r, c, state) {
            let top = state.chess_size * r + state.chess_hole_gap * r + state.margin_tb;
            let left = state.chess_size * c + state.chess_hole_gap * c + state.margin_lr;
            let center_x = left + state.chess_size;
            let center_y = top + state.chess_size;
            // console.log("r,c,center_x, center_y: ", r, c, center_x, center_y);
            return {
                id: "chess-hole-id-" + r * state.rows + c,
                width: state.chess_size,
                height: state.chess_size,
                borderRadius: state.borderRadius,
                top: top,
                left: left,
                used: false,
                player_type: 2,
                center: {x: center_x, y: center_y},
                row_id: r,
                col_id: c,
            };
        }

        /// create chess hole arguments
        if (chess_holes.length < 1) {
            for (let i = 0; i < this.state.rows; ++i) {
                for (let j = 0; j < this.state.cols; ++j) {
                    chess_holes.push(calcChessHole(i, j, this.state));
                }
            }
        }
        /// calculate column range
        if (column_range.length < 1) {
            for (let j = 0; j < this.state.cols; ++j) {
                let left = this.state.chess_size * j + this.state.chess_hole_gap * (j - 0.5) + this.state.margin_lr;
                let right = this.state.chess_size * (j + 1) + this.state.chess_hole_gap * (j + 0.5) + this.state.margin_lr;
                column_range.push({left: left, right: right});
            }
        }

        function createChess(page_x, page_y, state) {
            if (chess_holes.length > 1 && chess_holes.length == chess_list.length) {
                console.log("No available holes!");
                return null;
            }
            if (column_range.length < 1) {
                console.log("column_range is empty!");
                return null;
            }
            let pos_x = page_x - state.margin_lr - state.orig_x;
            let pos_y = page_y - state.margin_tb - state.orig_y;

            if (pos_x < 0 || pos_x > board_width) return null;
            if (pos_y < 0 || pos_y > board_height) return null;

            let col = -1;
            for (let c = 0; c < state.cols; c++) {
                if (pos_x >= column_range[c].left && pos_x < column_range[c].right) {
                    col = c;
                    break;
                }
            }
            if (col < 0) return null;
            let chess_hole_click = {};
            let is_found_pos = false;
            for (let i = state.rows - 1; i >= 0; i--) {
                let chess_hole = chess_holes[i * state.cols + col];
                if (chess_hole.used) continue;
                chess_hole_click = chess_hole;
                is_found_pos = true;
                chess_holes[i * state.cols + col].used = true;
                chess_holes[i * state.cols + col].player_type = player_type;
                break;
            }

            if (is_found_pos != true) {
                console.log("Did not find available hole!");
                return null;
            } else {
                console.log("Found available hole: ", chess_hole_click.top, chess_hole_click.left);
            }

            let chess = {
                id: "chess-id-" + chess_hole_click.id,
                width: state.chess_size,
                height: state.chess_size,
                borderRadius: state.borderRadius,
                top: chess_hole_click.top,
                left: chess_hole_click.left,
                row_id: chess_hole_click.row_id,
                col_id: chess_hole_click.col_id,
                color: player_type == 0 ? 'red' : 'blue',
            };
            chess_list.push(chess);

            /// Create win chess
            let rs = state.rows;
            let cs = state.cols;
            let win_grids = is_horizontal_win(chess.row_id, chess.col_id, player_type, rs, cs);
            if (win_grids == null) {
                win_grids = is_vertical_win(chess.row_id, chess.col_id, player_type, rs, cs);
            }
            if (win_grids == null) {
                win_grids = is_45degree_win(chess.row_id, chess.col_id, player_type, rs, cs);
            }
            if (win_grids == null) {
                win_grids = is_minus45degree_win(chess.row_id, chess.col_id, player_type, rs, cs);
            }
            if (win_grids != null && win_chess.length < 1) {
                for (let i = 0; i < win_grids.length; i++) {
                    let one_in_four = chess_holes[win_grids[i].row * state.cols + win_grids[i].col];
                    win_chess.push({
                        id: 'win-chess-' + win_grids[i].row * state.cols + win_grids[i].col,
                        top: one_in_four.top + (state.chess_size - 20) / 2,
                        left: one_in_four.left + (state.chess_size - 20) / 2,
                    });
                }
                winner = player_type;
            }

            return chess;
        }

        console.log("res: chess_list column_range win_chess", chess_list.length, column_range.length, win_chess.length);

        return (
            <TouchableOpacity
                style={[styles.page]}
                activeOpacity={1.0}
                setOpacityTo={1.0}
                onPress={(evt) => {
                    let chess = createChess(evt.nativeEvent.pageX, evt.nativeEvent.pageY, this.state);
                    this.props.press(chess);
                }
                }
            >
                {this.props.children}
                <View style={[styles.board, {
                    position: 'absolute',
                    height: board_height,
                    width: board_width,
                    top: board_top,
                    left: board_left,
                    borderRadius: radius,
                }]}>
                    {chess_holes.map((arg) => {
                        return (<ChessHoleComponent
                            key={arg.id}
                            style={[styles.hole, {
                                width: arg.width,
                                height: arg.height,
                                borderRadius: arg.borderRadius,
                                top: arg.top,
                                left: arg.left,
                            }]}
                        ></ChessHoleComponent>);
                    })}
                    {chess_list.map((arg) => {
                        return (<ChessHoleComponent
                            key={arg.id}
                            style={[styles.hole, {
                                width: arg.width,
                                height: arg.height,
                                borderRadius: arg.borderRadius,
                                top: arg.top,
                                left: arg.left,
                                backgroundColor: arg.color,
                            }]}
                        ></ChessHoleComponent>);
                    })}
                    {win_chess.map((arg) => {
                        return (<View key={arg.id} style={[styles.chess_win, {top: arg.top, left: arg.left}]}/>);
                    })}
                </View>
            </TouchableOpacity>);
    }
}

export default function App() {
    const [playerName, setPlayerName] = useState("Player 1");
    const [headChessColor, setHeadChessColor] = useState('red');
    const [modalVisible, setModalVisible] = useState(false);
    const [winPlayerName, setWinPlayerName] = useState("Player 1");

    return (
        <BoardComponent
            press={(chess) => {
                if (chess != null) {
                    player_type = (player_type == 0 ? 1 : 0);
                    setPlayerName(player_type == 0 ? "Player 1" : "Player 2");
                    setHeadChessColor(player_type == 0 ? 'red' : 'blue');

                    if (winner != 2) {
                        setWinPlayerName(playerName);
                        setModalVisible(true);
                    }

                }
            }}
        >
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    Alert.alert('Modal has been closed.');
                    setModalVisible(!modalVisible);
                }}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Congratulations!</Text>
                        <Text style={styles.modalText}>{winPlayerName} wins!</Text>
                        <Pressable
                            style={[styles.button, styles.buttonClose]}
                            onPress={() => {
                                setModalVisible(!modalVisible);
                                init_data();
                                setPlayerName(player_type == 0 ? "Player 1" : "Player 2");
                                setHeadChessColor(player_type == 0 ? 'red' : 'blue');
                            }}>
                            <Text style={styles.textStyle}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <View style={[styles.title]}>
                <Text style={[styles.player]}>{playerName}</Text>
                <View style={[styles.chess_head, {backgroundColor: headChessColor}]}></View>
            </View>

        </BoardComponent>
    )
        ;
}

const styles = StyleSheet.create({
        page: {
            width: '100%',
            height: '100%',
        },
        board: {
            position: 'absolute',
            borderRadius: 50,
            backgroundColor: 'green',
            padding: 10,
        },
        hole: {
            position: 'absolute',
            backgroundColor: 'white',
            width: 50,
            height: 50,
            borderRadius: 25,
        },
        title: {
            position: 'absolute',
            top: 0,
            left: 0,
            height: 100,
            width: '100%',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
        },
        player: {
            fontFamily: 'Times New Roman', fontSize: 24, color: 'red',
        },
        chess_head: {
            width: 40, height: 40, borderRadius: 20, backgroundColor: 'green',
        },
        chess_win: {
            width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', position: 'absolute',
        },
        centeredView: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 22,
        },
        modalView: {
            margin: 20,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 35,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
        modalText: {
            marginBottom: 15,
            textAlign: 'center',
            fontSize: 40,
            fontFamily: "Times New Roman",
        },
        buttonClose: {
            backgroundColor: '#2196F3',
        },
        button: {
            borderRadius: 20,
            padding: 10,
            elevation: 2,
        },
        textStyle: {
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: 40,
            fontFamily: "Times New Roman",
        },
    })
;
