import { getList, saveUser, remove, setRole, changeStatus, changeStatusBatch } from '@/api/system/user'
import { list as deptList } from '@/api/system/dept'
import { parseTime } from '@/utils/index'
import { roleTreeListByUserId } from '@/api/system/role'
// 权限判断指令
import permission from '@/directive/permission/index.js'

export default {
  directives: { permission },
  data() {
    return {
      roleDialog: {
        visible: false,
        id: 0,
        roles: [],
        roleTree: [],
        checkedRoleKeys: [],
        defaultProps: {
          id: 'id',
          label: 'name',
          children: 'children'
        }
      },
      formVisible: false,
      formTitle: '添加用户',
      deptTree: {
        show: false,
        data: [],
        defaultProps: {
          id: 'id',
          label: 'simpleName',
          children: 'children'
        }
      },
      isAdd: true,
      form: {
        id: '',
        account: '',
        name: '',
        birthday: '',
        sex: 1,
        email: '',
        password: '',
        rePassword: '',
        dept: '',
        status: true,
        deptid: 1,
        deptName: ''
      },
      rules: {
        account: [
          { required: true, message: '请输入登录账号', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        deptid: [
          { required: true, message: '请选择部门', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ],
        rePassword: [
          { required: true, message: '请输入确认密码', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入email', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入电话', trigger: 'blur' }
        ],
        birthday: [
          { required: true, message: '请输入出生日期', trigger: 'blur' }
        ]
      },
      listQuery: {
        pageIndex: 1,
        pageSize: 5,
        account: undefined,
        name: undefined
      },
      total: 0,
      list: null,
      listLoading: true,
      selRow: {},
      checkedRows: []
    }
  },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'gray',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  created() {
    this.init()
  },
  methods: {
    init() {
      deptList().then(data => {
        this.deptTree.data = data
      })
      this.fetchData()
    },
    fetchData() {
      this.listLoading = true
      getList(this.listQuery).then(response => {
        this.list = response.data
        this.listLoading = false
        this.total = response.totalCount
      })
    },
    search() {
      this.fetchData()
    },
    reset() {
      this.listQuery.account = ''
      this.listQuery.name = ''
      this.fetchData()
    },
    handleFilter() {
      this.listQuery.pageIndex = 1
      this.getList()
    },
    handleClose() {

    },
    fetchNext() {
      this.listQuery.pageIndex = this.listQuery.pageIndex + 1
      this.fetchData()
    },
    fetchPrev() {
      this.listQuery.pageIndex = this.listQuery.pageIndex - 1
      this.fetchData()
    },
    fetchPage(pageIndex) {
      this.listQuery.pageIndex = pageIndex
      this.fetchData()
    },
    changeSize(pageSize) {
      this.listQuery.pageSize = pageSize
      this.fetchData()
    },
    handleCurrentChange(currentRow, oldCurrentRow) {
      this.selRow = currentRow
    },
    resetForm() {
      this.form = {
        id: '',
        account: '',
        name: '',
        birthday: '',
        sex: 1,
        email: '',
        password: '',
        rePassword: '',
        dept: '',
        status: true,
        deptid: 1
      }
    },
    add() {
      this.resetForm()
      this.formTitle = '添加用户'
      this.formVisible = true
      this.isAdd = true
      if (this.$refs.form !== undefined) { this.$refs.form.resetFields() }
    },
    changeUserStatus(row) {
      changeStatus(row.id, 1).then(response => {
        row.status = row.status === 1 ? 0 : 1
        this.$notify({
          title: 'Success',
          message: '提交成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    changeUserStatusBatch(state) {
      var checkUserIds = this.checkedRows.map(function(value) {
        return value.id
      })
      var params = {
        userIds: checkUserIds,
        status: state
      }
      changeStatusBatch(params).then(response => {
        // this.fetchData()
        this.checkedRows.forEach(function(item, index) {
          item.status = params.status
        })
        this.$notify({
          title: 'Success',
          message: '提交成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    validPasswd() {
      if (!this.isAdd) {
        return true
      }
      if (this.form.password !== this.form.rePassword) {
        return false
      }
      if (this.form.password === '' || this.form.rePassword === '') {
        return false
      }
      return true
    },
    saveUser() {
      var self = this
      this.$refs['form'].validate((valid) => {
        if (valid) {
          if (this.validPasswd()) {
            var form = self.form
            if (form.status === true) {
              // 启用
              form.status = 1
            } else {
              // 冻结
              form.status = 2
            }
            form.id = parseInt(form.id) || 0
            form.birthday = parseTime(form.birthday, '{y}-{m}-{d}')
            form.createtime = parseTime(form.createtime)
            saveUser(form).then(response => {
              this.$message({
                message: '提交成功',
                type: 'success'
              })
              this.fetchData()
              this.formVisible = false
            })
          } else {
            this.$message({
              message: '密码不符合规则',
              type: 'error'
            })
          }
        } else {
          console.log('输入信息不完整!!')
          return false
        }
      })
    },
    checkSel() {
      if (this.selRow && this.selRow.id) {
        return true
      }
      this.$message({
        message: '请选中操作项',
        type: 'warning'
      })
      return false
    },
    edit(row) {
      // if (this.checkSel(row)) {
      // eslint-disable-next-line no-lone-blocks
      {
        this.isAdd = false
        this.form = row
        this.form.status = row.statusName === '启用'
        this.form.password = ''
        this.formTitle = '修改用户'
        this.formVisible = true
        if (this.$refs.form !== undefined) { this.$refs.form.resetFields() }
      }
    },
    remove() {
      if (this.checkSel()) {
        var id = this.selRow.id

        this.$confirm('确定删除该记录?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          remove(id).then(response => {
            this.$message({
              message: '删除成功',
              type: 'success'
            })
            this.fetchData()
          }).catch(err => {
            this.$notify.error({
              title: '错误',
              message: err
            })
          })
        }).catch(() => {
        })
      }
    },
    handleNodeClick(data, node) {
      this.form.deptid = data.id
      this.form.deptName = data.simpleName
      this.deptTree.show = false
    },
    openRole(row) {
      // if (this.checkSel()) {
      // eslint-disable-next-line no-lone-blocks
      {
        roleTreeListByUserId(row.id).then(data => {
          this.roleDialog.id = row.id
          this.roleDialog.roles = data.treeData
          this.roleDialog.checkedRoleKeys = data.checkedIds
          this.roleDialog.visible = true
        })
      }
    },
    setRole(id) {
      var checkedRoleKeys = this.$refs.roleTree.getCheckedKeys()
      /*
      console.log(checkedRoleKeys)
      var roleIds = ''
      for (var index in checkedRoleKeys) {
        roleIds += checkedRoleKeys[index] + ','
      }
      */
      setRole(id, checkedRoleKeys).then(response => {
        this.roleDialog.visible = false
        this.fetchData()
        this.$notify({
          title: 'Success',
          message: '提交成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    handleSelectionChange(rows) {
      this.checkedRows = rows
    }
  }
}