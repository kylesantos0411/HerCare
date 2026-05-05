package com.hercare.app;

import com.getcapacitor.JSObject;

final class JSObjectBuilder {
    private final JSObject object = new JSObject();

    private JSObjectBuilder() {}

    static JSObjectBuilder create() {
        return new JSObjectBuilder();
    }

    JSObjectBuilder put(String key, boolean value) {
        object.put(key, value);
        return this;
    }

    JSObject build() {
        return object;
    }
}
