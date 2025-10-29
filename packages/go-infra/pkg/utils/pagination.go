package utils

import (
	"fmt"
	"math"
	"strconv"

	"local/go-infra/pkg/adapter/http/contracts"
	"local/go-infra/pkg/mapper"

	"emperror.dev/errors"
	"github.com/goccy/go-json"
)

const (
	defaultSize = 10
	defaultPage = 1
)

type ListResult[T any] struct {
	Size       int   `json:"size,omitempty"       bson:"size"`
	Page       int   `json:"page,omitempty"       bson:"page"`
	TotalItems int64 `json:"totalItems,omitempty" bson:"totalItems"`
	TotalPage  int   `json:"totalPage,omitempty"  bson:"totalPage"`
	Items      []T   `json:"items,omitempty"      bson:"items"`
}

func NewListResult[T any](items []T, size int, page int, totalItems int64) *ListResult[T] {
	listResult := &ListResult[T]{Items: items, Size: size, Page: page, TotalItems: totalItems}

	listResult.TotalPage = getTotalPages(totalItems, size)

	return listResult
}

func (p *ListResult[T]) String() string {
	j, _ := json.Marshal(p)
	return string(j)
}

// GetTotalPages Get total pages int
func getTotalPages(totalCount int64, size int) int {
	d := float64(totalCount) / float64(size)
	return int(math.Ceil(d))
}

type FilterModel struct {
	Field      string `query:"field"      json:"field"`
	Value      string `query:"value"      json:"value"`
	Comparison string `query:"comparison" json:"comparison"`
}

type ListQuery struct {
	Size    int            `query:"size"    json:"size,omitempty"`
	Page    int            `query:"page"    json:"page,omitempty"`
	OrderBy string         `query:"orderBy" json:"orderBy,omitempty"`
	Filters []*FilterModel `query:"filters" json:"filters,omitempty"`
}

func NewListQuery(size int, page int) *ListQuery {
	return &ListQuery{Size: size, Page: page}
}

func NewListQueryFromQueryParams(size string, page string) *ListQuery {
	p := &ListQuery{Size: defaultSize, Page: defaultPage}

	if sizeNum, err := strconv.Atoi(size); err == nil && sizeNum != 0 {
		p.Page = sizeNum
	}

	if pageNum, err := strconv.Atoi(page); err == nil && pageNum != 0 {
		p.Page = pageNum
	}

	return p
}

func GetListQueryFromContext(c contracts.Context) (*ListQuery, error) {
	q := &ListQuery{}
	var page, size, orderBy string

	// Get query parameters using the generic interface
	size = c.QueryParam("size")
	page = c.QueryParam("page")
	orderBy = c.QueryParam("orderBy")

	// Handle filters from query params
	queryParams := c.QueryParams()
	if filterValues, ok := queryParams["filters"]; ok {
		for _, v := range filterValues {
			if v == "" {
				continue
			}
			f := &FilterModel{}
			// Try to bind from query params manually
			if fieldVal := c.QueryParam("field"); fieldVal != "" {
				f.Field = fieldVal
			}
			if valVal := c.QueryParam("value"); valVal != "" {
				f.Value = valVal
			}
			if compVal := c.QueryParam("comparison"); compVal != "" {
				f.Comparison = compVal
			}
			if f.Field != "" || f.Value != "" || f.Comparison != "" {
				q.Filters = append(q.Filters, f)
			}
		}
	}

	if err := q.SetPage(page); err != nil {
		return nil, err
	}
	if err := q.SetSize(size); err != nil {
		return nil, err
	}
	q.SetOrderBy(orderBy)

	return q, nil
}

// SetSize Set page size
func (q *ListQuery) SetSize(sizeQuery string) error {
	if sizeQuery == "" {
		q.Size = defaultSize
		return nil
	}
	n, err := strconv.Atoi(sizeQuery)
	if err != nil {
		return err
	}
	q.Size = n

	return nil
}

// SetPage Set page number
func (q *ListQuery) SetPage(pageQuery string) error {
	if pageQuery == "" {
		q.Page = defaultPage
		return nil
	}
	n, err := strconv.Atoi(pageQuery)
	if err != nil {
		return err
	}
	q.Page = n

	return nil
}

// SetOrderBy Set order by
func (q *ListQuery) SetOrderBy(orderByQuery string) {
	q.OrderBy = orderByQuery
}

// GetOffset Get offset
func (q *ListQuery) GetOffset() int {
	if q.Page == 0 {
		return 0
	}
	return (q.Page - 1) * q.Size
}

// GetLimit Get limit
func (q *ListQuery) GetLimit() int {
	return q.Size
}

// GetOrderBy Get OrderBy
func (q *ListQuery) GetOrderBy() string {
	return q.OrderBy
}

// GetPage Get OrderBy
func (q *ListQuery) GetPage() int {
	return q.Page
}

// GetSize Get OrderBy
func (q *ListQuery) GetSize() int {
	return q.Size
}

// GetQueryString get query string
func (q *ListQuery) GetQueryString() string {
	return fmt.Sprintf("page=%v&size=%v&orderBy=%s", q.GetPage(), q.GetSize(), q.GetOrderBy())
}

func ListResultToListResultDto[TDto any, TModel any](
	listResult *ListResult[TModel],
) (*ListResult[TDto], error) {
	if listResult == nil {
		return nil, errors.New("listResult is nil")
	}

	items, err := mapper.Map[[]TDto](listResult.Items)
	if err != nil {
		return nil, err
	}

	return &ListResult[TDto]{
		Items:      items,
		Size:       listResult.Size,
		Page:       listResult.Page,
		TotalItems: listResult.TotalItems,
		TotalPage:  listResult.TotalPage,
	}, nil
}
