function Pacman() {
    this.r= 0;   // row
    this.c= 0;   // col
    this.p= 0;   // animation phase
    this.pn= 0;  // next delta for p (+1 or -1)
    this.dir= 0; // the directions we could go
    this.md= 0;  // the current moving direction
    this.dx= 0;  // delta value for x-movement
    this.dy= 0;  // delta value for y-movement
    this.osx=0;  // x-offset for smooth animation
    this.osy=0;  // y-offset for smooth animation
}

// global vars

var pac= new PacMan();    // our instance of Pacman

var aSpeed=400;           // the cycle delay (from tile to tile) in msecs
var aStep=4;              // 4 intermediate steps in both directions for
                          //   smooth animation
var aSpan= new Array();   // we'll store animation offsets in pixels here

var movedir;              // stores the current user input
var mazeX= 0;             // maze's origin on the page in px
var mazeY= 0;
var pacTimer;             // timer stored here
var gameOn=flase;         // boolean flag: game on?
var runThru=false;        // boolean flag: pacman is moving?
var f2=new Array();       // array holding our maze grid information

var pacStr= new Array();  // used for display tasks
                          // associates possible direction codes
                          // with chars to compose image-names
pacStr[1]='r'; pacStr[2]='l';
pacStr[4]='b'; pacStr[8]='f';
pacStr[0]='f';

// vector-code : dx/dy reference

var tx= new Array();
var ty= new Array();
tx[0]=0;  ty[0]=0;
tx[1]=1;  ty[1]=0;  //r
tx[2]=-1; ty[2]=0;  //l
tx[4]=0;  ty[4]=-1; //u
tx[8]=0;  ty[8]=1;  //d

// *** things not defined here

function moveLayer(lr, x, y) {
    // move a layer to a given position
}

function setSprite(lr, img, s) {
    // exchange the image img of layer lr to src of s
}

function buildMaze() {
    // parse maze date
    // display the maze
    // and put direction data into 2D-array f2
}

// *** sorry (we want to keep this short)

// set up (must be called on start up)

function setSpan() {
    // a function to calculate our offsets
    // our tile width is 27px
    // offsets will be stored in array aSpan for any value of osx or osy
    // using negative indices is JavaScript 1.2 or higher

    for (n=1-aStep; n<aStep; n++) {
        if (n==0) aSpan[0]=0
        else aSpan[n]=Math.round(n*27/aStep);
    }
}

// (re)set pacman to home position

function pHome() {
    movedir=0;  // reset any user input
    // reset the pacman
    with (pac) {
        r=9; c=10;        // start position: row 9, col 10
        osx=0; osy=0;     // offsets for x and y values to zero
        md=0;             // not moving anywhere
        dir= 3;           // the directions we can move (left or right)
        dx=0; dy=0;       // dx and dy are set to zero
        pn=1; p=1;        // reset animation values
        setPac(r,c,'r1'); // display the pacman
    }
}

// display function

function setPac(r,c,s) {
    // displays the pacman with offsets and given image-source
    // unfortunatly we started our grid at origin [1,1],
    // so we have to substract 1 from r and c
    // rows and cols are multiplied by tile width 27px

    moveLayer(
    	'pacLr',
    	mazeX+27*(c-1)+aSpan[pac.osx],
    	mazeY+27*(r-1)+aSpan[pac.osy]
    );
    setSprite('pacLr','pac_i',s);
}

// start here

function newGame() {
    // leave, if we are running already
    if (gameOn) return;
    // set up the maze
    buildMaze();
    // initiate the pacman
    pHome();
    runThru=false;
    gameOn=true;
    // enter main loop
    doMove();
}

function move(x) {
    // store current user input in a global var
    // triggered by some javascript-handler

    movedir=x;
}

function doMove() {
    if (pacTimer) clearTimeout(pacTimer); // clear any duplicate timer
    var dateA=new Date(); // store entry time
    with (pac) {
        // "with": in this block look up properties of pac first

        // only if the offset is zero we're exactly over a tile.
        // any new directions of the pacman have to be evaluated
        if (osx+osy==0) pMove();

        // in case we're moving, we have to adjust our offset values
        // and display our new position
        if (runThru) {
            // add delta values to our x and y offsets
            osx+=dx;
            osy+=dy;
            // in case we're going out of bounds, reset any offsets
            // to be prepared for teleporting (moving from side to side)
            if ((c+dx)%21==0) osx=0;
            if ((r+dy)%15==0) osy=0;
            // limit our offsets to aStep
            osx%=aStep;
            osy%=aStep;
            // if offsets are zero, increment r, c
            // and handle any teleporting as well -> trunkBy(value, limit)
            if (osx==0) c=trunkBy(c+dx,20);
            if (osy==0) r=trunkBy(r+dy,14);
            // set phase pac.p to next step
            p+=pn;
            // if phase pac.p is either 3 or 1 reverse the direction
            // so we are going 1, 2, 3, 2, 1 ...
            if (p==3) pn=-1;
            if (p==1) pn=1;
            // if we are going up, just display our only backside image,
            // else compose the string for the correct movement phase.
            // pacStr associates pac.md with the chars 'r', 'l', 'f'
            if (md==4) setPac(r,c,'b1')
            else setPac(r,c,pacStr[md]+p);
            // in case we're placed on the center of a tile
            // (both offsets are zero) and we are at a crossing
            // (f2[r][c] != 0), read the crossing's information
            // and store it in pac.dir for later use
            // so we take with us the information of the last
            // crossing passed
            if ((osx+osy==0) && (f2[r][c])) dir=f2[r][c];
        }
    }
    // if the game is still on, calculate execution time
    // and substract it from our standard delay aSpeed/aStep
    // (game speed should not depend on animation step settings)
    if (gameOn) {
        var dateB=new Date();
        var mTO= dateA.getTime()-dateB.getTime();
        mTO+=Math.round(aSpeed/aStep);
        if (mTO<5) mTO=5; // minimum delay 5 msecs
        // set up the timout and store a reference in pacTimer
        pacTimer= setTimeout("doMove()",mTO);
    }
}

// getting a new direction

function pMove() {
    with (pac) {
        // evaluate the direction to go

        // pac.dir holds the current crossing's information
        // (current crossing: last grid code stored in pac.dir)
        // let's see, if there is a passage in the direction
        // of the last user input. if so, store it in pac.md

        // for we do not clear movedir, the last input will be
        // re-evaluated at the next grid point. This enables the
        // user to stear ahead without further input.

        if (dir&movedir) md= dir&movedir
        else {
            // no valid user input, so reuse our current
            // direction and mask it with the current crossing
            // (just binary and)
            md&=dir;
            // no direction left, so we're stuck agains a wall
            // stop the animation
            if (md==0) runThru=false;
        }

        // in case we are now moving
        if (md) {
            // yes we're moving (just in case we were stuck earlier)
            runThru=true;
            // intermediatly store any x and y values of our new direction
            // (don't waste another var here)
            dx=(md&3);
            dy=(md&12);
            // if there is a dx value
            if (dx) {
                // if we came this way, it must be legal to reverse later.
                // just store that horizontal movement is possible
                dir=3;
                // look up our current dx in tx
                dx=tx[dx];
            };
            if (dy) {
                // just as above with vertical and dy
                dir=12;
                dy=ty[dy];
            }
        }

        // whow, everything done here.
        // if not for intermediate offset calculations and
        // teleporting, this would be all we need.
    }
}

function trunkBy(v,m) {
    // evaluate any teleportation
    // resulting value v: 0 > v < m
    // so with m==20 => (v>=1) && (v<=19)
    // that's why we startet our grid at [1,1]

    v%=m;
    if (v==0) v=m;
    return v;
}