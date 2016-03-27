from flask import Flask, send_file, request, jsonify, send_from_directory, copy_current_request_context
from epics import caget, caput, camonitor, camonitor_clear
from PIL import Image
from io import BytesIO
from time import sleep

from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop

app = Flask(__name__)
http_server = HTTPServer(WSGIContainer(app))

@app.route('/scripts/<path:path>')
def send_js(path):
    """ Loading scripts for web app """
    return send_from_directory('static/scripts', path)

@app.route('/')
def root():
    """ Serving index """
    return app.send_static_file('./index.html')

@app.route('/caget/<record>/')
def api_caget(record):
    """ Get epics record """
    return str(caget(record))

@app.route('/caput/<record>/<value>/')
def api_caput(record, value):
    """ Put epics record """
    return str(caput(record, value))

@app.route('/image/')
def api_load_image():
    """ Load image from camera """

    res = caget("RASPICAM1:cam1:RESOLUTION_RBV")
    if res == 1:
        size_x = 640
        size_y = 480
    elif res == 2:
        size_x = 320
        size_y = 240
    else:
        size_x = 1280
        size_y = 960

    print "Using size " + str(size_x) + ", " + str(size_y)

    # read array data into image
    img = Image.frombytes('RGB', (size_x, size_y), caget("RASPICAM1:image1:ArrayData"))

    # convert PIL image into JPEG
    byte_io = BytesIO()
    img.save(byte_io, 'JPEG')
    byte_io.seek(0)

    # send png to client
    return send_file(byte_io, mimetype='image/jpeg')

@app.route('/info/', methods=['POST'])
def api_multiple_caget():
    """ Get all record values, which were requested in sent JSON """

    info_records = request.get_json()
    
    response_json = {}

    for record in info_records:
        response_json[record] = caget(record)

    return jsonify(response_json)

@app.route('/acquire/')
def acquire_photo():
    """ Call acquire and wait for new image """
    prev_num = caget('RASPICAM1:cam1:ArrayCounter_RBV')

    caput('RASPICAM1:cam1:Acquire', 1)
    
    while prev_num == caget('RASPICAM1:cam1:ArrayCounter_RBV'):
        # wait for the number to change
        sleep(0.2)

    return str(caget('RASPICAM1:cam1:ArrayCounter_RBV'))


if __name__ == "__main__":
    # run server
    http_server.listen(80)
    IOLoop.instance().start()
