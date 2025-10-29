package customfiber

import (
	"io"
	"mime/multipart"
	"net/http"
	"net/url"

	"local/go-infra/pkg/adapter/http/contracts"

	"github.com/gofiber/fiber/v2"
)

// fiberContextAdapter adapts fiber.Ctx to contracts.Context
type fiberContextAdapter struct {
	ctx *fiber.Ctx
}

// NewFiberContextAdapter creates a new Fiber context adapter
func NewFiberContextAdapter(ctx *fiber.Ctx) contracts.Context {
	return &fiberContextAdapter{ctx: ctx}
}

func (f *fiberContextAdapter) Request() *http.Request {
	// Convert fasthttp request to http.Request
	req := new(http.Request)
	req.Method = f.ctx.Method()
	req.URL, _ = url.Parse(f.ctx.OriginalURL())
	req.Proto = f.ctx.Protocol()
	req.Host = f.ctx.Hostname()
	req.RemoteAddr = f.ctx.IP()
	req.RequestURI = string(f.ctx.Request().RequestURI())
	req.Header = make(http.Header)
	f.ctx.Request().Header.VisitAll(func(key, value []byte) {
		req.Header.Add(string(key), string(value))
	})
	return req
}

func (f *fiberContextAdapter) ResponseWriter() http.ResponseWriter {
	return &fiberResponseWriter{ctx: f.ctx}
}

func (f *fiberContextAdapter) Param(name string) string {
	return f.ctx.Params(name)
}

func (f *fiberContextAdapter) QueryParam(name string) string {
	return f.ctx.Query(name)
}

func (f *fiberContextAdapter) QueryParams() url.Values {
	params := url.Values{}
	f.ctx.Request().URI().QueryArgs().VisitAll(func(key, value []byte) {
		params.Add(string(key), string(value))
	})
	return params
}

func (f *fiberContextAdapter) FormValue(name string) string {
	return f.ctx.FormValue(name)
}

func (f *fiberContextAdapter) FormFile(name string) (*multipart.FileHeader, error) {
	return f.ctx.FormFile(name)
}

func (f *fiberContextAdapter) MultipartForm() (*multipart.Form, error) {
	return f.ctx.MultipartForm()
}

func (f *fiberContextAdapter) Get(key string) interface{} {
	return f.ctx.Locals(key)
}

func (f *fiberContextAdapter) Set(key string, val interface{}) {
	f.ctx.Locals(key, val)
}

func (f *fiberContextAdapter) Bind(i interface{}) error {
	return f.ctx.BodyParser(i)
}

func (f *fiberContextAdapter) Validate(i interface{}) error {
	return nil
}

func (f *fiberContextAdapter) JSON(code int, i interface{}) error {
	return f.ctx.Status(code).JSON(i)
}

func (f *fiberContextAdapter) JSONBlob(code int, b []byte) error {
	f.ctx.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	f.ctx.Status(code)
	return f.ctx.Send(b)
}

func (f *fiberContextAdapter) XML(code int, i interface{}) error {
	return f.ctx.Status(code).XML(i)
}

func (f *fiberContextAdapter) String(code int, s string) error {
	f.ctx.Status(code)
	return f.ctx.SendString(s)
}

func (f *fiberContextAdapter) HTML(code int, html string) error {
	f.ctx.Set(fiber.HeaderContentType, fiber.MIMETextHTML)
	f.ctx.Status(code)
	return f.ctx.SendString(html)
}

func (f *fiberContextAdapter) Blob(code int, contentType string, b []byte) error {
	f.ctx.Set(fiber.HeaderContentType, contentType)
	f.ctx.Status(code)
	return f.ctx.Send(b)
}

func (f *fiberContextAdapter) Stream(code int, contentType string, r io.Reader) error {
	f.ctx.Set(fiber.HeaderContentType, contentType)
	f.ctx.Status(code)
	return f.ctx.SendStream(r)
}

func (f *fiberContextAdapter) NoContent(code int) error {
	return f.ctx.SendStatus(code)
}

func (f *fiberContextAdapter) Redirect(code int, url string) error {
	return f.ctx.Redirect(url, code)
}

func (f *fiberContextAdapter) Error(err error) {
	_ = f.ctx.App().Config().ErrorHandler(f.ctx, err)
}

func (f *fiberContextAdapter) Handler() interface{} {
	return f.ctx.Route().Handlers
}

func (f *fiberContextAdapter) SetHandler(h interface{}) {
	// Not directly supported in Fiber
}

func (f *fiberContextAdapter) Path() string {
	return f.ctx.Path()
}

func (f *fiberContextAdapter) RealIP() string {
	return f.ctx.IP()
}

func (f *fiberContextAdapter) Scheme() string {
	return f.ctx.Protocol()
}

// fiberResponseWriter wraps fiber.Ctx to implement http.ResponseWriter
type fiberResponseWriter struct {
	ctx *fiber.Ctx
}

func (w *fiberResponseWriter) Header() http.Header {
	header := make(http.Header)
	w.ctx.Response().Header.VisitAll(func(key, value []byte) {
		header.Add(string(key), string(value))
	})
	return header
}

func (w *fiberResponseWriter) Write(b []byte) (int, error) {
	return w.ctx.Write(b)
}

func (w *fiberResponseWriter) WriteHeader(statusCode int) {
	w.ctx.Status(statusCode)
}

// ConvertFiberHandler converts contracts.HandlerFunc to fiber.Handler
func ConvertFiberHandler(h contracts.HandlerFunc) fiber.Handler {
	return func(c *fiber.Ctx) error {
		adapter := NewFiberContextAdapter(c)
		return h(adapter)
	}
}

// ConvertFiberMiddleware converts contracts.MiddlewareFunc to fiber middleware
func ConvertFiberMiddleware(m contracts.MiddlewareFunc) fiber.Handler {
	return func(c *fiber.Ctx) error {
		adapter := NewFiberContextAdapter(c)
		handler := m(func(ctx contracts.Context) error {
			return c.Next()
		})
		return handler(adapter)
	}
}
